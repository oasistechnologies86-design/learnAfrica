"""Regression tests for reset-link + OTP resend behaviour.

Covers the reported bug: asking for a password-reset link a second time must
send a NEW link (and supersede the first), not silently do nothing. Also covers
the resend cooldown and the OTP equivalents.

The only stub is the outbound email boundary; routing, tokens and persistence
are the app's real code paths.

    python backend/test_reset_resend.py
"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('SECRET_KEY', 'test-secret-not-for-production')

# Cooldown off for the "every request must send" checks; the app reads these at
# import time, so they must be set before create_app().
os.environ['RESET_RESEND_COOLDOWN_SECONDS'] = '0'
os.environ['OTP_RESEND_COOLDOWN_SECONDS'] = '0'

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
    db.execute("INSERT INTO users (id,name,email,password_hash,role,is_active,token_version)"
               " VALUES (?,?,?,?,?,1,0)",
               ('stu1', 'Student', 'stu@example.com', generate_password_hash('Pass12345!'), 'student'))
    db.commit()

c = app.test_client()

# Stub only the external send boundary; record every message the app tries.
_sent = []


def _fake_send(db, to, name, subj, html, text, **kw):
    _sent.append({'to': to, 'subject': subj, 'html': html, 'text': text})
    return True, None


email_service.send_email = _fake_send

# Enable email + choose 'email' mode so the self-service path runs.
with app.app_context():
    db = get_db()
    cfg = email_service.load_email_config(db)
    cfg['enabled'] = True
    cfg['selected'] = 'sendpulse'
    email_service.save_email_config(db, cfg, None, False)
    c.put('/api/admin/settings/password-reset-mode', json={'mode': 'email'},
          headers={'Authorization': 'Bearer x'})  # unauth -> ignored, default is email


def reset_tokens():
    with app.app_context():
        return get_db().execute(
            "SELECT token_hash, used, expires_at FROM password_reset_tokens "
            "WHERE user_id='stu1' ORDER BY rowid").fetchall()


# ── The reported bug: a 2nd (and 3rd) request must send a fresh link ─────────
_sent.clear()
r1 = c.post('/api/auth/forgot-password', json={'email': 'stu@example.com'}).get_json() or {}
r2 = c.post('/api/auth/forgot-password', json={'email': 'stu@example.com'}).get_json() or {}
r3 = c.post('/api/auth/forgot-password', json={'email': 'stu@example.com'}).get_json() or {}

check('1st reset request sends an email', r1.get('email_sent') is True, str(r1))
check('2nd reset request ALSO sends an email (bug fix)', r2.get('email_sent') is True, str(r2))
check('3rd reset request ALSO sends an email (bug fix)', r3.get('email_sent') is True, str(r3))
check('exactly three reset emails were sent', len(_sent) == 3, f'count={len(_sent)}')
check('reset response advertises the 1-hour expiry', r1.get('expires_hours') == 1, str(r1))
check('reset response advertises the resend cooldown', 'resend_cooldown' in r1, str(r1))

# Superseding: only the newest token stays unused.
toks = reset_tokens()
check('three reset tokens were minted', len(toks) == 3, f'count={len(toks)}')
check('only the newest reset token is still usable',
      sum(1 for t in toks if not int(t['used'])) == 1,
      str([dict(t) for t in toks]))

# The link in the newest email still validates, and the link in the FIRST
# email no longer does.
import re  # noqa: E402
links = [re.search(r'token=([A-Za-z0-9_\-]+)', m['text']) for m in _sent]
newest = links[-1].group(1)
oldest = links[0].group(1)
v_new = c.get(f'/api/auth/reset-password/validate?token={newest}').get_json() or {}
v_old = c.get(f'/api/auth/reset-password/validate?token={oldest}').get_json() or {}
check('the newest link is valid', v_new.get('valid') is True, str(v_new))
check('the first link is dead once a second is requested', v_old.get('valid') is False, str(v_old))

# ── The support email appears in the reset email (same as the footer) ────────
check('reset email carries the support address',
      'support@learnafrica.com' in _sent[-1]['html'] and 'support@learnafrica.com' in _sent[-1]['text'],
      '')

# ── OTP: repeated resends work, newest code supersedes older ones ────────────
_sent.clear()
for i in range(4):
    rr = c.post('/api/auth/send-verification-code', json={'email': 'otp@example.com'}).get_json() or {}
check('four OTP sends all succeed', len(_sent) == 4, f'count={len(_sent)}')
check('OTP response advertises a 15-minute expiry', rr.get('expires_minutes') == 15, str(rr))
with app.app_context():
    rows = get_db().execute(
        "SELECT used FROM email_verification_codes WHERE email='otp@example.com'").fetchall()
check('only the newest OTP code stays usable',
      sum(1 for r in rows if not int(r['used'])) == 1, str([dict(r) for r in rows]))

print()
if failures:
    print(f'{len(failures)} CHECK(S) FAILED: {failures}')
    sys.exit(1)
print('ALL RESET/OTP RESEND CHECKS PASSED')
