"""Regression checks for the admin broadcast lifecycle.

Run with: python backend/test_broadcast_management.py
The test uses an isolated SQLite database and never touches production data.
"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('SECRET_KEY', 'broadcast-test-secret-not-for-production')

from werkzeug.security import generate_password_hash  # noqa: E402
from app import create_app  # noqa: E402
from app.database import get_db, init_db  # noqa: E402

_tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
_tmp.close()
os.environ['DATABASE_PATH'] = _tmp.name

app = create_app()
app.config['TESTING'] = True
app.config['DATABASE'] = _tmp.name
app.config['USE_POSTGRES'] = False

failures = []


def check(name, condition, detail=''):
    print(('PASS' if condition else 'FAIL') + f' - {name}' + (f' [{detail}]' if detail else ''))
    if not condition:
        failures.append(name)


with app.app_context():
    init_db(app)
    db = get_db()
    for uid, name, email, role in (
        ('broadcast-admin', 'Broadcast Admin', 'broadcast-admin@example.com', 'admin'),
        ('broadcast-student', 'Broadcast Student', 'broadcast-student@example.com', 'student'),
    ):
        db.execute(
            'INSERT INTO users (id,name,email,password_hash,role,is_active,token_version) VALUES (?,?,?,?,?,1,0)',
            (uid, name, email, generate_password_hash('BroadcastPass123!'), role)
        )
    db.commit()

client = app.test_client()


def token_for(email):
    response = client.post('/api/auth/login', json={'email': email, 'password': 'BroadcastPass123!'})
    return (response.get_json() or {}).get('token')


admin_token = token_for('broadcast-admin@example.com')
student_token = token_for('broadcast-student@example.com')
admin_headers = {'Authorization': f'Bearer {admin_token}'}
student_headers = {'Authorization': f'Bearer {student_token}'}

# Non-admins cannot inspect or operate the broadcast centre.
response = client.get('/api/admin/broadcasts', headers=student_headers)
check('broadcast history is admin-only', response.status_code == 403, response.status_code)

# Draft creation and editing.
response = client.post('/api/admin/broadcasts', headers=admin_headers, json={
    'title': 'Initial title', 'message': 'Initial message', 'role': 'student',
    'type': 'info', 'action': 'draft'
})
created = response.get_json() or {}
broadcast_id = created.get('id')
check('draft is created', response.status_code == 200 and bool(broadcast_id), response.status_code)

response = client.put(f'/api/admin/broadcasts/{broadcast_id}', headers=admin_headers, json={
    'title': 'Updated title', 'message': 'Updated message', 'role': 'student', 'type': 'info'
})
check('draft can be edited', response.status_code == 200, response.status_code)

response = client.get('/api/admin/broadcasts', headers=admin_headers)
items = (response.get_json() or {}).get('broadcasts', [])
draft = next((item for item in items if item.get('id') == broadcast_id), {})
check('history contains edited draft', draft.get('title') == 'Updated title' and draft.get('status') == 'draft')

# Send to one student and ensure a retry does not duplicate the notification.
response = client.post(f'/api/admin/broadcasts/{broadcast_id}/send', headers=admin_headers, json={})
sent = response.get_json() or {}
check('draft sends to selected audience', response.status_code == 200 and sent.get('delivered') == 1, sent)
response = client.post(f'/api/admin/broadcasts/{broadcast_id}/send', headers=admin_headers, json={})
with app.app_context():
    db = get_db()
    notification_count = db.execute(
        'SELECT COUNT(*) AS c FROM user_notifications WHERE user_id=? AND data=?',
        ('broadcast-student', f'broadcast_{broadcast_id}')
    ).fetchone()['c']
check('retry does not duplicate a successful delivery', notification_count == 1, notification_count)

response = client.put(f'/api/admin/broadcasts/{broadcast_id}', headers=admin_headers, json={
    'title': 'Should not change', 'message': 'No', 'role': 'student', 'type': 'info'
})
check('sent broadcast is immutable', response.status_code == 409, response.status_code)

# Duplicate, archive, restore, then permanently delete.
response = client.post(f'/api/admin/broadcasts/{broadcast_id}/duplicate', headers=admin_headers)
duplicate_id = (response.get_json() or {}).get('id')
check('duplicate creates a new draft', response.status_code == 200 and bool(duplicate_id))

response = client.post(f'/api/admin/broadcasts/{broadcast_id}/archive', headers=admin_headers)
check('broadcast can be archived', response.status_code == 200, response.status_code)
active = (client.get('/api/admin/broadcasts', headers=admin_headers).get_json() or {}).get('broadcasts', [])
archived = (client.get('/api/admin/broadcasts?archived=true', headers=admin_headers).get_json() or {}).get('broadcasts', [])
check('archived broadcast leaves active history', all(item.get('id') != broadcast_id for item in active))
check('archived broadcast remains recoverable', any(item.get('id') == broadcast_id for item in archived))

response = client.post(f'/api/admin/broadcasts/{broadcast_id}/restore', headers=admin_headers)
check('archived broadcast can be restored', response.status_code == 200, response.status_code)

response = client.delete(f'/api/admin/broadcasts/{broadcast_id}', headers=admin_headers)
check('permanent delete succeeds', response.status_code == 200, response.status_code)
with app.app_context():
    db = get_db()
    ledger_count = db.execute('SELECT COUNT(*) AS c FROM admin_broadcasts WHERE id=?', (broadcast_id,)).fetchone()['c']
    notification_count = db.execute(
        'SELECT COUNT(*) AS c FROM user_notifications WHERE data=?', (f'broadcast_{broadcast_id}',)
    ).fetchone()['c']
check('permanent delete removes linked notifications and history row', ledger_count == 0 and notification_count == 0)

if failures:
    print(f'\\n{len(failures)} broadcast test(s) failed: {failures}')
    raise SystemExit(1)
print('\\nAll broadcast management checks passed.')
