"""Regression coverage for account deletion retention and admin controls."""
import hashlib
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
        ('ins3', 'Suspended Instructor', 'suspended@example.com', 'instructor', 'approved'),
    ]:
        db.execute(
            "INSERT INTO users (id,name,email,password_hash,role,instructor_status,is_active,token_version) "
            "VALUES (?,?,?,?,?,?,1,0)",
            (uid, name, email, generate_password_hash('Pass12345!'), role, status))
    db.execute("UPDATE users SET is_active=0 WHERE id='ins3'")
    db.execute(
        "INSERT INTO instructor_applications (id,user_id,status,bio,applied_at) "
        "VALUES ('app1','ins1','pending','Experienced teacher','2026-11-20')")
    # A receipt-like transaction proves account deletion does not cascade into
    # the user's financial history.
    db.execute(
        "INSERT INTO transactions (id,receipt_id,type,user_id,user_name,user_email,amount,currency,status,provider) "
        "VALUES ('tx1','receipt-1','purchase','stu1','Student One','student@example.com',100,'GHS','success','test')")
    db.commit()

# Simulate a legacy soft-deleted row from before email archiving existed.
with app.app_context():
    db = get_db()
    db.execute(
        "INSERT INTO users (id,name,email,password_hash,role,is_active,deleted_at) "
        "VALUES ('legacy-deleted','Legacy Deleted','legacy@example.com',?,'student',0,'2026-10-01 12:00:00')",
        (generate_password_hash('Pass12345!'),)
    )
    db.commit()
with app.app_context():
    init_db(app)
    db = get_db()
    legacy = db.execute(
        "SELECT email,deleted_email FROM users WHERE id='legacy-deleted'"
    ).fetchone()
check('migration archives emails for previously deleted accounts',
      bool(legacy and legacy['deleted_email'] == 'legacy@example.com'
           and str(legacy['email']).endswith('@deleted.learnafrica.invalid')))

client = app.test_client()


def token(email):
    response = client.post('/api/auth/login', json={'email': email, 'password': 'Pass12345!'})
    return (response.get_json() or {}).get('token')


def auth(value):
    return {'Authorization': f'Bearer {value}'}


admin_token = token('admin@example.com')
student_token = token('student@example.com')
instructor_token = token('instructor@example.com')
student2_token = token('student2@example.com')
check('test accounts can authenticate', bool(admin_token and student_token and instructor_token))

# Create outstanding recovery credentials and a queued request to prove deletion
# invalidates them before the email can belong to a later account.
legacy_reset_raw = 'old-student-reset-token'
with app.app_context():
    db = get_db()
    db.execute(
        "INSERT INTO password_reset_requests (id,email,user_id,reason,status) "
        "VALUES ('reset-stu1','student@example.com','stu1','Forgot Password','pending')"
    )
    db.execute(
        "INSERT INTO password_reset_tokens (id,request_id,user_id,token_hash,expires_at,used) "
        "VALUES ('reset-token-stu1','reset-stu1','stu1',?,?,0)",
        (hashlib.sha256(legacy_reset_raw.encode()).hexdigest(), '2027-01-01 00:00:00')
    )
    db.execute(
        "INSERT INTO email_verification_codes (id,email,code_hash,expires_at,used) "
        "VALUES ('verify-stu1','student@example.com','test-hash','2027-01-01 00:00:00',0)"
    )
    db.commit()

# Student-requested deletion: row and financial history remain; session is revoked.
response = client.delete('/api/users/account', json={'email': 'student@example.com'}, headers=auth(student_token))
check('self-service deletion succeeds', response.status_code == 200, response.status_code)
with app.app_context():
    db = get_db()
    row = db.execute("SELECT deleted_at,is_active,token_version FROM users WHERE id='stu1'").fetchone()
    tx = db.execute("SELECT id FROM transactions WHERE id='tx1'").fetchone()
    event = db.execute("SELECT event_type FROM account_deletion_events WHERE user_id='stu1'").fetchone()
check('self-deleted user is retained but inactive', bool(row and row['deleted_at'] and not row['is_active']))
check('self-deletion revokes existing token', client.get('/api/users/settings', headers=auth(student_token)).status_code in (401, 403))
check('financial transaction remains after deletion', bool(tx))
check('self-deletion event is recorded', bool(event and event['event_type'] == 'self_deleted'))
deleted_login = client.post('/api/auth/login', json={'email': 'student@example.com', 'password': 'Pass12345!'})
check('deleted account cannot authenticate using its archived email',
      deleted_login.status_code == 404 and (deleted_login.get_json() or {}).get('account_not_found') is True)
with app.app_context():
    db = get_db()
    old_reset = db.execute("SELECT used FROM password_reset_tokens WHERE id='reset-token-stu1'").fetchone()
    old_request = db.execute("SELECT status FROM password_reset_requests WHERE id='reset-stu1'").fetchone()
    old_code = db.execute("SELECT used FROM email_verification_codes WHERE id='verify-stu1'").fetchone()
check('deletion revokes outstanding password-reset tokens', bool(old_reset and old_reset['used']))
check('deletion dismisses queued password-reset requests', bool(old_request and old_request['status'] == 'dismissed'))
check('deletion invalidates outstanding email-verification codes', bool(old_code and old_code['used']))
old_reset_validation = client.get('/api/auth/reset-password/validate?token=' + legacy_reset_raw)
check('old password-reset links cannot validate after deletion', old_reset_validation.status_code == 400)

# Deleted instructor applicant remains in the pending application list and
# cannot be approved even if an admin calls the endpoint directly.
response = client.delete('/api/users/account', json={'email': 'instructor@example.com'}, headers=auth(instructor_token))
check('instructor applicant can self-delete', response.status_code == 200, response.status_code)
# The active instructor-management endpoint must hide deleted accounts while
# preserving genuinely suspended accounts for possible later reactivation.
instructor_list = client.get('/api/admin/instructors', headers=auth(admin_token))
instructor_rows = (instructor_list.get_json() or {}).get('instructors', [])
listed_ids = {item.get('id') for item in instructor_rows}
check('self-deleted instructor is excluded from instructor management', 'ins1' not in listed_ids)
check('genuinely suspended instructor remains in instructor management', 'ins3' in listed_ids)
reactivate_deleted = client.put('/api/admin/users/ins1/suspend', headers=auth(admin_token))
check('deleted instructor cannot be reactivated through admin endpoint', reactivate_deleted.status_code == 409, reactivate_deleted.status_code)
response = client.get('/api/admin/instructor-applications?status=pending', headers=auth(admin_token))
apps = (response.get_json() or {}).get('applications', [])
app_row = next((item for item in apps if item.get('user_id') == 'ins1'), None)
check('deleted instructor application is excluded from active review queue', app_row is None)
# Deleted applicants must also be excluded from badge and dashboard totals.
tab_counts = client.get('/api/admin/tab-counts', headers=auth(admin_token))
check('deleted applicant is excluded from pending application badge',
      (tab_counts.get_json() or {}).get('counts', {}).get('applications') == 0)
stats = client.get('/api/admin/stats', headers=auth(admin_token))
stats_data = stats.get_json() or {}
check('dashboard active user totals exclude deleted accounts',
      stats.status_code == 200 and stats_data.get('total_users') == 2
      and stats_data.get('total_students') == 1
      and stats_data.get('total_instructors') == 0)
response = client.put('/api/admin/instructor-applications/ins1/review',
                      json={'action': 'approve'}, headers=auth(admin_token))
check('admin cannot approve a deleted applicant', response.status_code == 409, response.status_code)

# Keep a separate active learner token for permission checks after deleted users'
# sessions have correctly been revoked.
with app.app_context():
    db = get_db()
    db.execute(
        "INSERT INTO users (id,name,email,password_hash,role,is_active,token_version) "
        "VALUES ('stu3','Student Three','student3@example.com',?,'student',1,0)",
        (generate_password_hash('Pass12345!'),)
    )
    db.commit()
student3_token = token('student3@example.com')

# Admin deletion is also soft-delete; history is permanent and email can be reused.
admin_delete = client.delete('/api/admin/users/stu2', headers=auth(admin_token))
check('admin deletion is a soft-delete', admin_delete.status_code == 200, admin_delete.status_code)
listed = client.get('/api/admin/deleted-accounts?q=student2&role=student', headers=auth(admin_token))
accounts = (listed.get_json() or {}).get('accounts', [])
check('admin can search and filter deleted accounts', listed.status_code == 200 and len(accounts) == 1)
check('deleted account email is preserved in history', bool(accounts and accounts[0].get('email') == 'student2@example.com'))
filtered = client.get(
    '/api/admin/deleted-accounts?role=student&reason=admin_action&date_from=2026-01-01&date_to=2026-12-31&sort=oldest&page=1&per_page=1',
    headers=auth(admin_token)
)
filtered_data = filtered.get_json() or {}
check('deletion date, reason, sort and pagination filters work',
      filtered.status_code == 200 and len(filtered_data.get('accounts', [])) == 1
      and filtered_data.get('page') == 1 and filtered_data.get('per_page') == 1
      and filtered_data.get('count') == 1)
invalid_dates = client.get('/api/admin/deleted-accounts?date_from=not-a-date', headers=auth(admin_token))
check('invalid date filters are rejected safely', invalid_dates.status_code == 400)
check('non-admin cannot view deleted accounts', client.get('/api/admin/deleted-accounts', headers=auth(student3_token)).status_code == 403)
history = client.get('/api/admin/deleted-accounts/stu2/history', headers=auth(admin_token))
check('deletion history is available', history.status_code == 200 and bool((history.get_json() or {}).get('events')))

# Legacy clear routes must never hide or mutate permanent history.
cleared = client.post('/api/admin/deleted-accounts/clear-all?q=student2&role=student', headers=auth(admin_token))
check('legacy clear-all endpoint is disabled', cleared.status_code == 410, cleared.status_code)
legacy_single = client.post('/api/admin/deleted-accounts/ins1/clear', headers=auth(admin_token))
check('legacy single-clear endpoint is disabled', legacy_single.status_code == 410, legacy_single.status_code)
with app.app_context():
    db = get_db()
    stu2 = db.execute("SELECT deleted_email,email,deletion_cleared_at FROM users WHERE id='stu2'").fetchone()
    ins1 = db.execute("SELECT deletion_cleared_at FROM users WHERE id='ins1'").fetchone()
    retained_stu2 = db.execute("SELECT id FROM users WHERE id='stu2'").fetchone()
check('admin deletion archives email and uses a unique tombstone', bool(
    stu2 and stu2['deleted_email'] == 'student2@example.com'
    and str(stu2['email']).endswith('@deleted.learnafrica.invalid')))
check('clear requests do not alter retention metadata', bool(
    stu2 and not stu2['deletion_cleared_at'] and ins1 and not ins1['deletion_cleared_at']))
check('deleted account remains retained in database', bool(retained_stu2))
read_only_edit = client.put(
    '/api/admin/users/stu2',
    json={'email': 'changed@example.com'},
    headers=auth(admin_token)
)
check('archived account identity cannot be edited', read_only_edit.status_code == 409)

# Re-register using the same email. A new user id is created and linked to the
# previous deleted record, without moving any historical transactions.
signup = client.post('/api/auth/signup', json={
    'name': 'Student Two Rejoined',
    'email': 'student2@example.com',
    'password': 'NewPass12345!',
    'phone': '+233241234567',
    'accept_terms': True,
    'agreement_version': '2026-11',
})
signup_data = signup.get_json() or {}
new_id = (signup_data.get('user') or {}).get('id')
check('same email can register again after deletion', signup.status_code == 201 and bool(new_id), signup.status_code)
with app.app_context():
    db = get_db()
    old = db.execute(
        "SELECT deleted_email,email,re_registered_to_user_id,re_registered_at FROM users WHERE id='stu2'"
    ).fetchone()
    new = db.execute("SELECT id,email,deleted_at FROM users WHERE id=?", (new_id,)).fetchone() if new_id else None
check('re-registration creates a distinct account id', bool(new and new['id'] != 'stu2'))
check('old and new accounts are linked without restoring the old account', bool(
    old and old['re_registered_to_user_id'] == new_id and old['re_registered_at']
    and new and not new['deleted_at'] and new['email'] == 'student2@example.com'))
deleted_after = client.get('/api/admin/deleted-accounts?q=student2', headers=auth(admin_token))
reregistered = client.get('/api/admin/re-registered-accounts?q=student2', headers=auth(admin_token))
check('re-registered account leaves the current deleted list', not (deleted_after.get_json() or {}).get('accounts'))
check('re-registered history shows both account identities',
      reregistered.status_code == 200 and len((reregistered.get_json() or {}).get('accounts', [])) == 1
      and (reregistered.get_json() or {}).get('accounts', [])[0].get('new_account_id') == new_id)
check('re-registered history remains admin-only',
      client.get('/api/admin/re-registered-accounts', headers=auth(student3_token)).status_code == 403)
check('new account can log in with its new password',
      client.post('/api/auth/login', json={'email': 'student2@example.com', 'password': 'NewPass12345!'}).status_code == 200)

# Also prove self-deleted account email reuse leaves the old financial record
# attached to its original user id, not the newly created account.
signup_old = client.post('/api/auth/signup', json={
    'name': 'Student One Rejoined',
    'email': 'student@example.com',
    'password': 'NewPass12345!',
    'phone': '+233241234568',
    'accept_terms': True,
    'agreement_version': '2026-11',
})
signup_old_data = signup_old.get_json() or {}
new_old_id = (signup_old_data.get('user') or {}).get('id')
with app.app_context():
    db = get_db()
    original_tx = db.execute("SELECT user_id FROM transactions WHERE id='tx1'").fetchone()
    original_user = db.execute("SELECT re_registered_to_user_id FROM users WHERE id='stu1'").fetchone()
    new_user_tx = db.execute("SELECT id FROM transactions WHERE user_id=?", (new_old_id,)).fetchone() if new_old_id else None
check('self-deleted account can also re-register with same email',
      signup_old.status_code == 201 and bool(new_old_id) and new_old_id != 'stu1', signup_old.status_code)
check('historical transaction stays with the original account',
      bool(original_tx and original_tx['user_id'] == 'stu1'
           and original_user and original_user['re_registered_to_user_id'] == new_old_id
           and not new_user_tx))

# A new reset request after re-registration must belong to the new account,
# never reuse the previous account's dismissed request.
forgot = client.post('/api/auth/forgot-password', json={'email': 'student@example.com'})
with app.app_context():
    db = get_db()
    newest_reset_request = db.execute(
        "SELECT id,user_id,status FROM password_reset_requests "
        "WHERE LOWER(email)=LOWER('student@example.com') ORDER BY created_at DESC LIMIT 1"
    ).fetchone()
    reset_queue = client.get('/api/admin/password-reset-requests?status=all', headers=auth(admin_token))
    visible_reset_ids = {item.get('id') for item in (reset_queue.get_json() or {}).get('requests', [])}
check('new password-reset request is attached to the new account',
      forgot.status_code == 200 and newest_reset_request
      and newest_reset_request['user_id'] == new_old_id
      and newest_reset_request['id'] != 'reset-stu1')
check('old deleted-account reset request is not exposed in admin queue',
      'reset-stu1' not in visible_reset_ids)

print()
if failures:
    print(f'{len(failures)} CHECK(S) FAILED: {failures}')
    sys.exit(1)
print('ALL ACCOUNT-DELETION CHECKS PASSED')
