"""Regression tests for Google sign-in-only behaviour.

Google authentication must never create a new account. Users first register
with their email address; Google can then authenticate that existing account.
"""
import os
import sys
import tempfile
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('SECRET_KEY', 'test-secret-not-for-production')
os.environ['GOOGLE_OAUTH_CLIENT_ID'] = 'test-client.apps.googleusercontent.com'

_tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
_tmp.close()
os.environ['DATABASE_PATH'] = _tmp.name

from app import create_app  # noqa: E402
from app.main import socketio  # noqa: E402,F401
from app.database import init_db, get_db  # noqa: E402

app = create_app()
app.config['TESTING'] = True
app.config['DATABASE'] = _tmp.name
app.config['USE_POSTGRES'] = False
c = app.test_client()

failures = []


def check(name, cond, extra=''):
    print(('PASS' if cond else 'FAIL') + f' - {name}' + (f' [{extra}]' if extra else ''))
    if not cond:
        failures.append(name)


with app.app_context():
    init_db(app)

BASE = {'aud': 'test-client.apps.googleusercontent.com',
        'email_verified': 'true', 'picture': ''}


class _Resp:
    status_code = 200

    def __init__(self, payload):
        self._p = payload

    def json(self):
        return self._p


def google(payload):
    with patch('app.main.requests.get', return_value=_Resp(payload)):
        r = c.post('/api/auth/google', json={'credential': 'fake', 'role': 'student'})
        return r.status_code, (r.get_json() or {})


def register(email, name='Test Learner'):
    return c.post('/api/auth/signup', json={
        'name': name, 'email': email, 'password': 'StrongPass123!',
        'role': 'student',
    })


status, body = google({**BASE, 'email': 'new.google@gmail.com', 'name': 'New Google'})
check('Google sign-in rejects an email with no existing Learn Africa account',
      status == 404 and 'user' not in body, body)
with app.app_context():
    missing = get_db().execute("SELECT id FROM users WHERE email='new.google@gmail.com'").fetchone()
check('rejected Google sign-in does not create a user', missing is None)

r = register('ama.mensah@gmail.com', 'ama.mensah')
check('normal email registration creates the account first', r.status_code in (200, 201), r.status_code)
status, body = google({**BASE, 'email': 'ama.mensah@gmail.com', 'name': 'Ama Mensah'})
user = body.get('user') or {}
check('Google signs into an existing email-registered account',
      status == 200 and user.get('email') == 'ama.mensah@gmail.com', body)
check('Google can repair an old email-local-part display name',
      user.get('name') == 'Ama Mensah', user.get('name'))

with app.app_context():
    db = get_db()
    db.execute("UPDATE users SET name='My Custom Name' WHERE email='ama.mensah@gmail.com'")
    db.commit()
status, body = google({**BASE, 'email': 'ama.mensah@gmail.com', 'name': 'Ama Mensah'})
user = body.get('user') or {}
check('Google does not overwrite a name the user chose',
      status == 200 and user.get('name') == 'My Custom Name', user.get('name'))

r = c.post('/api/auth/login', json={'email': 'ama.mensah@gmail.com', 'password': 'StrongPass123!'})
check('existing email account can still sign in with its password', r.status_code == 200, r.status_code)

print()
if failures:
    print(f'{len(failures)} CHECK(S) FAILED: {failures}')
    sys.exit(1)
print('ALL GOOGLE SIGN-IN TESTS PASSED')
