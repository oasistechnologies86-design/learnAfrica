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
from app.password_reset_tracking import _as_iso_utc  # noqa: E402
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


# Timestamp serialization regressions: Flask's legacy HTTP-date format and
# database timestamp strings must remain readable for old and new requests.
check('RFC 2822 timestamp converts to ISO UTC',
      _as_iso_utc('Wed, 25 Nov 2026 14:20:00 GMT') == '2026-11-25T14:20:00Z',
      str(_as_iso_utc('Wed, 25 Nov 2026 14:20:00 GMT')))
check('SQL timestamp converts to ISO UTC',
      _as_iso_utc('2026-11-25 14:20:00') == '2026-11-25T14:20:00Z',
      str(_as_iso_utc('2026-11-25 14:20:00')))


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
        ('fix1a', 'Reset Email Student', 'fix1a@example.com', 'student'),
        ('fix1c', 'Manual Reset Student', 'fix1c@example.com', 'student'),
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
    row = get_db().execute("SELECT status, handling_method, last_action_at FROM password_reset_requests "
                           "WHERE LOWER(email)='stu@example.com'").fetchone()
check('manual request is recorded as pending', row and row['status'] == 'pending', str(dict(row) if row else None))
check('admin-configured Manual Mode is recorded separately', row and row['handling_method'] == 'manual_mode', str(dict(row) if row else None))
check('manual request receives a last-action timestamp', row and bool(row['last_action_at']), str(dict(row) if row else None))


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
check('email mode response confirms a link is on its way', 'check your inbox' in (body.get('message') or '').lower(), str(body.get('message')))
with app.app_context():
    row = get_db().execute("SELECT status, handling_method, email_sent_at FROM password_reset_requests "
                           "WHERE LOWER(email)='stu@example.com'").fetchone()
check('email-mode request is marked email_sent', row and row['status'] == 'email_sent', str(dict(row) if row else None))
check('automatic delivery records its handling method', row and row['handling_method'] == 'automatic_email', str(dict(row) if row else None))
check('automatic delivery records the actual send timestamp', row and bool(row['email_sent_at']), str(dict(row) if row else None))


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
check('email mode + failed send switches to manual review',
      r.get('mode') == 'manual' and r.get('delivery_status') == 'manual_fallback', str(r))
check('email mode + failed send tells the user automatic delivery failed',
      'could not be completed' in (r.get('message') or '').lower(), str(r.get('message')))
check('the failed send is never reported as sent', r.get('email_sent') is False, str(r))
with app.app_context():
    row = get_db().execute("SELECT status, delivery_error, handling_method, fallback_at FROM password_reset_requests WHERE LOWER(email)='fix1a@example.com'").fetchone()
check('failed delivery is tagged manual_fallback with its provider error',
      row and row['status'] == 'manual_fallback' and row['handling_method'] == 'manual_fallback' and bool(row['fallback_at']) and 'SendPulse send failed' in (row['delivery_error'] or ''),
      str(dict(row) if row else None))
admin_rows = (c.get('/api/admin/password-reset-requests', headers=ADMIN).get_json() or {}).get('requests', [])
fallback_item = next((item for item in admin_rows if item.get('email') == 'fix1a@example.com'), None)
check('admin request list exposes Manual Fallback and the delivery reason',
      fallback_item and fallback_item.get('status') == 'manual_fallback' and 'SendPulse send failed' in (fallback_item.get('delivery_error') or ''),
      str(fallback_item))
check('admin request list includes the student name and ISO request date',
      fallback_item and fallback_item.get('student_name') == 'Reset Email Student'
      and fallback_item.get('created_at_iso'), str(fallback_item))
check('failed automatic email leaves no undisclosed active reset token',
      fallback_item is not None and fallback_item.get('has_active_link') is False, str(fallback_item))
counts = (c.get('/api/admin/tab-counts', headers=ADMIN).get_json() or {}).get('counts', {})
check('manual fallback is included in the admin tab badge', counts.get('password_reset_requests', 0) >= 1, str(counts))

# Admin can safely prepare a fresh link and email it after automatic delivery fails.
req_id = fallback_item.get('id') if fallback_item else None
bad_link = c.post(f'/api/admin/password-reset-requests/{req_id}/email-link',
                  json={'link': 'https://example.invalid/reset-password?token=forged'}, headers=ADMIN) if req_id else None
check('admin email action rejects an arbitrary or forged reset link',
      bad_link is not None and bad_link.status_code == 400, str(bad_link.status_code if bad_link else None))
link_result = c.post(f'/api/admin/password-reset-requests/{req_id}/generate-link', headers=ADMIN) if req_id else None
fresh_link = (link_result.get_json() or {}).get('link', '') if link_result else ''
_saved_send_email = email_service.send_email
email_service.send_email = lambda *args, **kwargs: (True, None)
try:
    sent_result = c.post(f'/api/admin/password-reset-requests/{req_id}/email-link',
                         json={'link': fresh_link}, headers=ADMIN) if fresh_link else None
finally:
    email_service.send_email = _saved_send_email
check('admin can email the valid generated link after fallback',
      sent_result is not None and sent_result.status_code == 200, str(sent_result.status_code if sent_result else None))
with app.app_context():
    row = get_db().execute("SELECT status, delivery_error, handling_method, fallback_at FROM password_reset_requests WHERE LOWER(email)='fix1a@example.com'").fetchone()
check('successful admin email clears delivery error and records Email Sent',
      row and row['status'] == 'email_sent' and not row['delivery_error'], str(dict(row) if row else None))
check('successful admin follow-up retains its original Manual Fallback classification',
      row and row['handling_method'] == 'manual_fallback', str(dict(row) if row else None))
check('successful admin follow-up preserves the original fallback event timestamp',
      row and bool(row['fallback_at']), str(dict(row) if row else None))
r2 = c.post('/api/auth/forgot-password', json={'email': 'fix1b@example.com'}).get_json() or {}
check('email mode + unknown address is explicitly rejected',
      r2.get('code') == 'account_not_found' and "couldn't find an account" in (r2.get('error') or '').lower(), str(r2))
email_service.send_via_sendpulse = _saved_sp

# Manual mode still uses the admin wording.
set_mode('manual')
r3 = c.post('/api/auth/forgot-password', json={'email': 'stu@example.com'}).get_json() or {}
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

# ── FIX 4: successful password change completes only its own request ───────
def seed_completion_request(email, handling_method, status):
    # Seed an isolated request so IP/email throttling in the forgot-password
    # endpoint cannot make these completion-path tests flaky.
    with app.app_context():
        db = get_db()
        db.execute("DELETE FROM password_reset_tokens WHERE user_id=(SELECT id FROM users WHERE LOWER(email)=LOWER(?))", (email,))
        db.execute("DELETE FROM password_reset_requests WHERE LOWER(email)=LOWER(?)", (email,))
        user = db.execute("SELECT id FROM users WHERE LOWER(email)=LOWER(?)", (email,)).fetchone()
        if not user:
            raise AssertionError(f"Missing seeded test account: {email}")
        db.execute(
            "INSERT INTO password_reset_requests (id,email,user_id,reason,status) VALUES (?,?,?,?,?)",
            (str(__import__('uuid').uuid4()), email, user['id'], 'Forgot Password', status)
        )
        db.commit()
    # The first admin-list call / link generation runs the additive tracking migration.


def complete_request_for(email, password):
    # Read the test-created request directly so this regression isolates the
    # reset endpoint instead of depending on admin-list presentation/filtering.
    with app.app_context():
        db = get_db()
        request_row = db.execute(
            "SELECT id, email, handling_method FROM password_reset_requests "
            "WHERE LOWER(email)=LOWER(?) ORDER BY created_at DESC LIMIT 1",
            (email,)
        ).fetchone()
        item = dict(request_row) if request_row else None
    if not item:
        return None, None, None
    generated = c.post(f"/api/admin/password-reset-requests/{item['id']}/generate-link",
                       headers=ADMIN)
    link = (generated.get_json() or {}).get('link', '')
    import re as _re
    token_match = _re.search(r'[?&]token=([^&]+)', link)
    if not token_match:
        return item, None, None
    token_value = token_match.group(1)
    rejected = c.post('/api/auth/reset-password', json={
        'token': token_value, 'password': password,
        'confirm_password': 'mismatched-confirmation',
    })
    check(f'{email} mismatched confirmation is rejected before completion',
          rejected.status_code == 400, str(rejected.status_code))
    result = c.post('/api/auth/reset-password', json={
        'token': token_value, 'password': password,
        'confirm_password': password,
    })
    return item, result, token_value


# Automatic Email request.
set_email_enabled(True)
set_mode('email')
seed_completion_request('stu@example.com', 'automatic_email', 'email_sent')
with app.app_context():
    db = get_db()
    db.execute("UPDATE password_reset_requests SET handling_method='automatic_email', email_sent_at=CURRENT_TIMESTAMP WHERE LOWER(email)='stu@example.com'")
    db.commit()
auto_item, auto_done, auto_token = complete_request_for('stu@example.com', 'AutoPass123!')
check('Automatic Email request completes after password is changed',
      auto_done is not None and auto_done.status_code == 200, str(auto_done.status_code if auto_done else None))
with app.app_context():
    auto_row = get_db().execute("SELECT status, handling_method, completed_at, last_action_at FROM password_reset_requests WHERE LOWER(email)='stu@example.com'").fetchone()
check('Automatic Email completion records timestamp and preserves method',
      auto_row and auto_row['status'] == 'completed' and auto_row['handling_method'] == 'automatic_email'
      and bool(auto_row['completed_at']) and bool(auto_row['last_action_at']), str(dict(auto_row) if auto_row else None))
auto_admin = next((x for x in (c.get('/api/admin/password-reset-requests', headers=ADMIN).get_json() or {}).get('requests', []) if x.get('email') == 'stu@example.com'), None)
check('admin list exposes Completed Date as an ISO timestamp',
      auto_admin and auto_admin.get('completed_at_iso'), str(auto_admin))


# Manual Mode request.
set_mode('manual')
seed_completion_request('fix1c@example.com', 'manual_mode', 'pending')
with app.app_context():
    db = get_db()
    db.execute("UPDATE password_reset_requests SET handling_method='manual_mode' WHERE LOWER(email)='fix1c@example.com'")
    db.commit()
manual_item, manual_done, manual_token = complete_request_for('fix1c@example.com', 'ManualPass123!')
check('Manual Mode request completes after password is changed',
      manual_done is not None and manual_done.status_code == 200, str(manual_done.status_code if manual_done else None))
with app.app_context():
    manual_row = get_db().execute("SELECT status, handling_method, completed_at FROM password_reset_requests WHERE LOWER(email)='fix1c@example.com'").fetchone()
check('Manual Mode completion preserves manual_mode classification',
      manual_row and manual_row['status'] == 'completed' and manual_row['handling_method'] == 'manual_mode'
      and bool(manual_row['completed_at']), str(dict(manual_row) if manual_row else None))


# Manual Fallback request from the earlier provider-failure scenario.
# Generate a fresh link and complete it; the original fallback origin must survive.
set_mode('email')
set_email_enabled(True)
seed_completion_request('fix1a@example.com', 'manual_fallback', 'manual_fallback')
with app.app_context():
    db = get_db()
    db.execute("UPDATE password_reset_requests SET handling_method='manual_fallback', fallback_at=CURRENT_TIMESTAMP WHERE LOWER(email)='fix1a@example.com'")
    db.commit()
fallback_item_done, fallback_done, fallback_consumed_token = complete_request_for('fix1a@example.com', 'FallbackPass123!')
check('Manual Fallback request completes after password is changed',
      fallback_done is not None and fallback_done.status_code == 200, str(fallback_done.status_code if fallback_done else None))
with app.app_context():
    fallback_row = get_db().execute("SELECT status, handling_method, fallback_at, completed_at FROM password_reset_requests WHERE LOWER(email)='fix1a@example.com'").fetchone()
check('Manual Fallback completion preserves fallback classification and dates',
      fallback_row and fallback_row['status'] == 'completed' and fallback_row['handling_method'] == 'manual_fallback'
      and bool(fallback_row['fallback_at']) and bool(fallback_row['completed_at']),
      str(dict(fallback_row) if fallback_row else None))


# A consumed token cannot be reused.
if fallback_consumed_token:
    second = c.post('/api/auth/reset-password', json={
        'token': fallback_consumed_token, 'password': 'SecondPass123!',
        'confirm_password': 'SecondPass123!',
    })
else:
    second = None
check('a reset token succeeds only once',
      fallback_done is not None and fallback_done.status_code == 200
      and second is not None and second.status_code == 400,
      f"first={fallback_done.status_code if fallback_done else None}, second={second.status_code if second else None}")
bad_attempt = c.post('/api/auth/reset-password', json={
    'token': 'not-a-real-token', 'password': 'InvalidPass123!',
    'confirm_password': 'InvalidPass123!',
})
check('invalid reset token is rejected without a completion',
      bad_attempt.status_code == 400, str(bad_attempt.status_code))


print()
if failures:
    print(f'{len(failures)} CHECK(S) FAILED: {failures}')
    sys.exit(1)
print('ALL PASSWORD-RESET MODE CHECKS PASSED')
