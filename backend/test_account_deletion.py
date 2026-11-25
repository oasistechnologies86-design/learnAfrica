"""Regression coverage for account deletion retention and admin controls."""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('SECRET_KEY', 'test-secret-not-for-production')

from app import create_app  # noqa: E402
from app.database import init_db, get_db  # noqa: E402
from werkzeug.security import generate_password_hash  # noqa: E402

_tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
_tmp.close()
os.environ['DATABASE_PATH'] = _tmp.name
app = create_app()
app.config['TESTING'] = True
app.config['DATABASE'] = _tmp.name
app.config['USE_POSTGRES'] = False
failures = []


def check(name, condition, extra=''):
    print(('PASS' if condition else 'FAIL') + f' - {name}' + (f' [{extra}]' if extra else ''))
    if not condition:
        failures.append(name)


with app.app_context():
    init_db(app)
    db = get_db()
    for uid, name, email, role, status in [
        ('adm1', 'Admin', 'admin@example.com', 'admin', 'none'),
        ('stu1', 'Student One', 'student@example.com', 'student', 'none'),
        ('ins1', 'Instructor Applicant', 'instructor@example.com', 'instructor', 'pending'),
        ('stu2', 'Student Two', 'student2@example.com', 'student', 'none'),
    ]:
        db.execute(
            "INSERT INTO users (id,name,email,password_hash,role,instructor_status,is_active,token_version) "
            "VALUES (?,?,?,?,?,?,1,0)",
            (uid, name, email, generate_password_hash('Pass12345!'), role, status))
    db.execute(
        "INSERT INTO instructor_applications (id,user_id,status,bio,applied_at) "
        "VALUES ('app1','ins1','pending','Experienced teacher','2026-11-20')")
    # A receipt-like transaction proves account deletion does not cascade into
    # the user's financial history.
    db.execute(
        "INSERT INTO transactions (id,receipt_id,type,user_id,user_name,user_email,amount,currency,status,provider) "
        "VALUES ('tx1','receipt-1','purchase','stu1','Student One','student@example.com',100,'GHS','success','test')")
    db.commit()

client = app.test_client()


def token(email):
    response = client.post('/api/auth/login', json={'email': email, 'password': 'Pass12345!'})
    return (response.get_json() or {}).get('token')


def auth(value):
    return {'Authorization': f'Bearer {value}'}


admin_token = token('admin@example.com')
student_token = token('student@example.com')
instructor_token = token('instructor@example.com')
check('test accounts can authenticate', bool(admin_token and student_token and instructor_token))

# Student-requested deletion: row and financial history remain; session is revoked.
response = client.delete('/api/users/account', json={'email': 'student@example.com'}, headers=auth(student_token))
check('self-service deletion succeeds', response.status_code == 200, response.status_code)
with app.app_context():
    db = get_db()
    row = db.execute("SELECT deleted_at,is_active,token_version FROM users WHERE id='stu1'").fetchone()
    tx = db.execute("SELECT id FROM transactions WHERE id='tx1'").fetchone()
    event = db.execute("SELECT event_type FROM account_deletion_events WHERE user_id='stu1'").fetchone()
check('self-deleted user is retained but inactive', bool(row and row['deleted_at'] and not row['is_active']))
check('self-deletion revokes existing token', client.get('/api/users/me', headers=auth(student_token)).status_code in (401, 403))
check('financial transaction remains after deletion', bool(tx))
check('self-deletion event is recorded', bool(event and event['event_type'] == 'self_deleted'))

# Deleted instructor applicant remains in the pending application list and
# cannot be approved even if an admin calls the endpoint directly.
response = client.delete('/api/users/account', json={'email': 'instructor@example.com'}, headers=auth(instructor_token))
check('instructor applicant can self-delete', response.status_code == 200, response.status_code)
response = client.get('/api/admin/instructor-applications?status=pending', headers=auth(admin_token))
apps = (response.get_json() or {}).get('applications', [])
app_row = next((item for item in apps if item.get('user_id') == 'ins1'), None)
check('deleted instructor application remains visible', bool(app_row and app_row.get('account_deleted_at')))
response = client.put('/api/admin/instructor-applications/ins1/review',
                      json={'action': 'approve'}, headers=auth(admin_token))
check('admin cannot approve a deleted applicant', response.status_code == 409, response.status_code)

# Admin deletion is also soft-delete; list, search, role filtering, and history
# are admin-only. Clear-all only clears entries matching its current filters.
admin_delete = client.delete('/api/admin/users/stu2', headers=auth(admin_token))
check('admin deletion is a soft-delete', admin_delete.status_code == 200, admin_delete.status_code)
listed = client.get('/api/admin/deleted-accounts?q=student2&role=student', headers=auth(admin_token))
accounts = (listed.get_json() or {}).get('accounts', [])
check('admin can search and filter deleted accounts', listed.status_code == 200 and len(accounts) == 1)
check('non-admin cannot view deleted accounts', client.get('/api/admin/deleted-accounts', headers=auth(token('student2@example.com'))).status_code == 403)
history = client.get('/api/admin/deleted-accounts/stu2/history', headers=auth(admin_token))
check('deletion history is available', history.status_code == 200 and bool((history.get_json() or {}).get('events')))
# The filtered bulk clear must not clear the separately deleted instructor.
cleared = client.post('/api/admin/deleted-accounts/clear-all?q=student2&role=student', headers=auth(admin_token))
check('filtered clear-all succeeds', cleared.status_code == 200, cleared.status_code)
with app.app_context():
    db = get_db()
    stu2 = db.execute("SELECT deletion_cleared_at FROM users WHERE id='stu2'").fetchone()
    ins1 = db.execute("SELECT deletion_cleared_at FROM users WHERE id='ins1'").fetchone()
check('bulk clear hides only matching account', bool(stu2 and stu2['deletion_cleared_at']) and ins1 and not ins1['deletion_cleared_at'])
check('cleared account remains retained in database', bool(db.execute("SELECT id FROM users WHERE id='stu2'").fetchone()))

print()
if failures:
    print(f'{len(failures)} CHECK(S) FAILED: {failures}')
    sys.exit(1)
print('ALL ACCOUNT-DELETION CHECKS PASSED')
