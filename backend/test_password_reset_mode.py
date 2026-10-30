"""Regression tests for the password-reset mode toggle + Gmail failover.

Boots the real app on a throwaway SQLite database and exercises the real
routes. The only thing stubbed is the outbound network call to Google /
SendPulse (the external boundary) — the app's own routing, failover and
persistence are the real code paths.

    python backend/test_password_reset_mode.py
"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('SECRET_KEY', 'test-secret-not-for-production')

from app import create_app  # noqa: E402
from app.main import socketio  # noqa: E402,F401
from app.database import init_db, get_db  # noqa: E402
from app import email_service  # noqa: E402
from werkzeug.security import generate_password_hash  # noqa: E402

_tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
_tmp.close()
os.environ['DATABASE_PATH'] = _tmp.name

app = create_app()
app.config['TESTING'] = True
app.config['DATABASE'] = _tmp.name
app.config['USE_POSTGRES'] = False

failures = []


def check(name, cond, extra=''):
    print(('PASS' if cond else 'FAIL') + f' - {name}' + (f' [{extra}]' if extra else ''))
    if not cond:
        failures.append(name)


with app.app_context():
    init_db(app)
    db = get_db()
    for _col in ('instructor_status', 'payment_method', 'payment_details', 'email_verified'):
        try:
            db.execute("ALTER TABLE users ADD COLUMN %s TEXT" % _col)
        except Exception:
            pass
    for uid, name, email, role in [
        ('adm1', 'Admin', 'admin@example.com', 'admin'),
        ('stu1', 'Student', 'stu@example.com', 'student'),
    ]:
        db.execute("INSERT INTO users (id,name,email,password_hash,role,is_active,token_version)"
                   " VALUES (?,?,?,?,?,1,0)",
                   (uid, name, email, generate_password_hash('Pass12345!'), role))
    db.commit()

c = app.test_client()


def login(email, pw='Pass12345!'):
    r = c.post('/api/auth/login', json={'email': email, 'password': pw})
    return (r.get_json() or {}).get('token')


adm_tok = login('admin@example.com')
ADMIN = {'Authorization': f'Bearer {adm_tok}'}

# The only stub: the external send boundary. Gmail "fails" with the exact
# invalid_grant error from the report; SendPulse "succeeds". Everything else
# (routing, failover, persistence) is the app's real code.
_calls = []
email_service.send_via_gmail = lambda acct, to, name, subj, html, text: (
    _calls.append('gmail'),
    (False, 'Google token refresh failed: 400 {"error":"invalid_grant","error_description":"Token has been expired or revoked."}'))[1]
email_service.send_via_sendpulse = lambda acct, to, name, subj, html, text: (
    _calls.append('sendpulse'), (True, None))[1]


def configure_senders(selected='sendpulse'):
    """Give the app a working SendPulse sender plus a dead Gmail slot."""
    with app.app_context():
        db = get_db()
        cfg = email_service.load_email_config(db)
        cfg['enabled'] = True
        cfg['selected'] = selected
        cfg['gmail1'] = dict(cfg.get('gmail1') or {}, connected=True, active=True,
                             refresh_token='dead-token', client_id='cid',
                             client_secret='sec', sender_email='a@example.com')
        cfg['gmail2'] = dict(cfg.get('gmail2') or {}, connected=False, active=False)
        cfg['sendpulse'] = dict(cfg.get('sendpulse') or {}, connected=True, active=True,
                                client_id='sp', client_secret='sp', sender_email='b@example.com')
        email_service.save_email_config(db, cfg, None, False)


def set_email_enabled(enabled):
    with app.app_context():
        db = get_db()
        cfg = email_service.load_email_config(db)
        cfg['enabled'] = bool(enabled)
        email_service.save_email_config(db, cfg, None, False)


def set_mode(mode):
    return c.put('/api/admin/settings/password-reset-mode', json={'mode': mode}, headers=ADMIN)


# ── The pure failover rule: a dead Google token must be retryable ────────────
check('invalid_grant is treated as retryable (safe to fail over)',
      email_service._retryable('Google token refresh failed: 400 {"error":"invalid_grant"}'))
check('a real bounce stays terminal (never double-send)',
      not email_service._retryable('550 mailbox unavailable: no such user'))


# ── Failover: dead Gmail token falls through to SendPulse ────────────────────
configure_senders(selected='gmail1')
_calls.clear()
with app.app_context():
    ok, err = email_service.send_email(get_db(), 'stu@example.com', '', 'subj',
                                       '<p>x</p>', 'x', use_postgres=False)
check('dead Gmail token fails over to SendPulse instead of stopping', ok is True, str(err))
check('failover actually tried gmail then sendpulse', _calls[:2] == ['gmail', 'sendpulse'], str(_calls))


# ── Public mode endpoint ─────────────────────────────────────────────────────
set_email_enabled(True)
r = set_mode('manual')
check('admin can set password reset mode to manual', r.status_code == 200, str(r.status_code))
pub = c.get('/api/auth/password-reset-mode').get_json() or {}
check('public mode endpoint reports manual', pub.get('mode') == 'manual', str(pub))
check('public mode endpoint reports a 24h SLA', pub.get('sla_hours') == 24, str(pub))

# A non-admin cannot change it.
r = c.put('/api/admin/settings/password-reset-mode', json={'mode': 'email'},
          headers={'Authorization': 'Bearer not-a-token'})
check('password reset mode change requires an admin', r.status_code in (401, 403), str(r.status_code))
r = set_mode('nonsense')
check('an invalid mode is rejected', r.status_code == 400, str(r.status_code))


# ── Manual mode: the request is queued, nothing is emailed ───────────────────
with app.app_context():
    db = get_db()
    db.execute("DELETE FROM password_reset_requests")
    db.commit()
_calls.clear()
r = c.post('/api/auth/forgot-password', json={'email': 'stu@example.com'})
body = r.get_json() or {}
check('manual mode does not email the user', body.get('email_sent') is False, str(body))
check('manual response tells the user an admin will send it within 24 hours',
      'within 24 hours' in (body.get('message') or ''), str(body.get('message')))
with app.app_context():
    row = get_db().execute("SELECT status FROM password_reset_requests "
                           "WHERE LOWER(email)='stu@example.com'").fetchone()
check('manual request is recorded as pending', row and row['status'] == 'pending', str(dict(row) if row else None))


# ── Email mode: the link is emailed straight away ────────────────────────────
set_email_enabled(True)
set_mode('email')
with app.app_context():
    db = get_db()
    db.execute("DELETE FROM password_reset_requests")
    db.commit()
_calls.clear()
r = c.post('/api/auth/forgot-password', json={'email': 'stu@example.com'})
body = r.get_json() or {}
check('email mode sends the reset link', body.get('email_sent') is True, str(body))
check('email mode response confirms a link is on its way', 'on its way' in (body.get('message') or ''), str(body.get('message')))
with app.app_context():
    row = get_db().execute("SELECT status FROM password_reset_requests "
                           "WHERE LOWER(email)='stu@example.com'").fetchone()
check('email-mode request is marked link_sent', row and row['status'] == 'link_sent', str(dict(row) if row else None))


# ── Email OFF forces manual even if the stored choice is 'email' ─────────────
set_email_enabled(False)
pub = c.get('/api/auth/password-reset-mode').get_json() or {}
check('with email off the effective mode falls back to manual', pub.get('mode') == 'manual', str(pub))
check('the stored choice is still reported to admins', True)  # stored value unchanged by design
adm = c.get('/api/admin/settings/password-reset-mode', headers=ADMIN).get_json() or {}
check('admin sees stored=email but effective=manual',
      adm.get('mode') == 'email' and adm.get('effective_mode') == 'manual', str(adm))


# ── The email template renders a real, structured email ──────────────────────
html = email_service.render_email('Reset your password', '<p>hello</p>',
                                  button_text='Reset my password',
                                  button_url='https://example.com/r?t=abc',
                                  footer_note='expires in 12 hours')
check('template is a full html document', html.strip().startswith('<!DOCTYPE html>'), html[:20])
check('template carries the button and its url', 'Reset my password' in html and 'https://example.com/r?t=abc' in html)
check('template includes the footer note', 'expires in 12 hours' in html)
otp = email_service.render_email('Verify your email', '<p>hi</p>', code='123456')
check('otp template shows the code', '123456' in otp)


# ── FIX 1: in email mode the message follows the MODE, not the send result ───
# Reproduces the reported bug: toggle on "Send by email", but every sender fails
# (e.g. a dead Gmail token). The user must NOT be told an admin will contact them.
set_email_enabled(True)
set_mode('email')
configure_senders(selected='sendpulse')
_saved_sp = email_service.send_via_sendpulse
email_service.send_via_sendpulse = lambda *a, **k: (False, 'SendPulse send failed: 500 boom')
with app.app_context():
    get_db().execute("DELETE FROM password_reset_requests")
    get_db().commit()
r = c.post('/api/auth/forgot-password', json={'email': 'fix1a@example.com'}).get_json() or {}
check('email mode + failed send does NOT show the admin prompt',
      'administrator' not in (r.get('message') or '').lower(), str(r.get('message')))
check('email mode + failed send still says a link is on its way',
      'on its way' in (r.get('message') or ''), str(r.get('message')))
check('the failed send is still reported to the admin as not sent',
      r.get('email_sent') is False, str(r))
r2 = c.post('/api/auth/forgot-password', json={'email': 'fix1b@example.com'}).get_json() or {}
check('email mode + unknown address shows the same email wording',
      'administrator' not in (r2.get('message') or '').lower(), str(r2.get('message')))
email_service.send_via_sendpulse = _saved_sp

# Manual mode still uses the admin wording.
set_mode('manual')
r3 = c.post('/api/auth/forgot-password', json={'email': 'fix1c@example.com'}).get_json() or {}
check('manual mode still tells the user an admin will send the link',
      'administrator' in (r3.get('message') or '').lower(), str(r3.get('message')))
set_mode('email')


# ── FIX 2: a successful test send clears the stale sender error ──────────────
configure_senders(selected='gmail1')
with app.app_context():
    db = get_db()
    cfg = email_service.load_email_config(db)
    cfg['gmail1']['last_error'] = 'Google token refresh failed: 400 invalid_grant'
    email_service.save_email_config(db, cfg, None, False)
    email_service.record_failure(db, 'gmail1',
        'Google token refresh failed: 400 invalid_grant', False)
_saved_g = email_service.send_via_gmail
email_service.send_via_gmail = lambda *a, **k: (True, None)
with app.app_context():
    db = get_db()
    email_service.send_email(db, 'x@example.com', '', 's', '<b>h</b>', 'h',
                             provider='gmail1', use_postgres=False)
    cfg2 = email_service.load_email_config(db)
    row = db.execute("SELECT last_error FROM email_usage WHERE provider='gmail1'").fetchone()
check('a successful test send clears the sender last_error',
      not (cfg2['gmail1'].get('last_error')), repr(cfg2['gmail1'].get('last_error')))
check('a successful test send clears the usage-row error',
      not (row and row['last_error']), str(dict(row) if row else None))
email_service.send_via_gmail = _saved_g


# ── FIX 3: reconnect forgets the stored error (usage panel goes clean) ───────
with app.app_context():
    db = get_db()
    email_service.record_failure(db, 'gmail2',
        'Google token refresh failed: 400 invalid_grant', False)
    email_service.clear_provider_error(db, 'gmail2', False)
    row = db.execute("SELECT last_error FROM email_usage WHERE provider='gmail2'").fetchone()
check('reconnect clears the provider error row',
      not (row and row['last_error']), str(dict(row) if row else None))

print()
if failures:
    print(f'{len(failures)} CHECK(S) FAILED: {failures}')
    sys.exit(1)
print('ALL PASSWORD-RESET MODE CHECKS PASSED')
