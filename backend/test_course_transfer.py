"""Regression coverage for course ownership transfer and instructor deletion protection."""
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
        ('admin1', 'Platform Admin', 'admin-transfer@example.com', 'admin', 'none'),
        ('old1', 'Original Instructor', 'old-transfer@example.com', 'instructor', 'approved'),
        ('new1', 'Receiving Instructor', 'new-transfer@example.com', 'instructor', 'approved'),
        ('student1', 'Enrolled Student', 'student-transfer@example.com', 'student', 'none'),
    ]:
        db.execute(
            "INSERT INTO users (id,name,email,password_hash,role,instructor_status,is_active,token_version) "
            "VALUES (?,?,?,?,?,?,1,0)",
            (uid, name, email, generate_password_hash('Pass12345!'), role, status))
    db.execute(
        """INSERT INTO courses (id,title,instructor_id,instructor_name,is_published,is_visible)
           VALUES ('course-transfer-1','Transferred Course','old1','Original Instructor',1,1)""")
    db.execute(
        """INSERT INTO live_sessions
           (id,course_id,instructor_id,title,scheduled_at,duration_minutes,meeting_url)
           VALUES ('session-transfer-1','course-transfer-1','old1','Live class',
                   '2027-01-01 10:00:00',60,'https://example.com/meeting')""")
    db.execute(
        """INSERT INTO coupons
           (id,code,discount_type,discount_value,applies_to,course_id,created_by)
           VALUES ('coupon-transfer-1','MOVECOURSE','percent',10,'course','course-transfer-1','old1')""")
    db.execute(
        """INSERT INTO transactions
           (id,receipt_id,type,course_id,course_title,instructor_id,amount,status,payout_status,provider)
           VALUES ('tx-transfer-1','receipt-transfer-1','purchase','course-transfer-1',
                   'Transferred Course','old1',100,'success','pending','test')""")
    db.commit()

client = app.test_client()


def token(email):
    response = client.post('/api/auth/login', json={'email': email, 'password': 'Pass12345!'})
    return (response.get_json() or {}).get('token')


def auth(value):
    return {'Authorization': f'Bearer {value}'}


admin_token = token('admin-transfer@example.com')
old_token = token('old-transfer@example.com')
new_token = token('new-transfer@example.com')
check('transfer test accounts authenticate', bool(admin_token and old_token and new_token))

# The owner cannot delete an instructor account while the course is still assigned.
response = client.delete('/api/users/account', json={'email': 'old-transfer@example.com'}, headers=auth(old_token))
check('self-deletion is blocked while instructor owns a course',
      response.status_code == 409 and (response.get_json() or {}).get('code') == 'COURSES_MUST_BE_TRANSFERRED',
      response.status_code)

# Submit, recipient acceptance, then Admin approval.
response = client.post('/api/instructor/course-transfers', json={
    'course_id': 'course-transfer-1', 'recipient_id': 'new1',
    'reason': 'The receiving instructor will continue teaching this course.'
}, headers=auth(old_token))
request_id = (response.get_json() or {}).get('request_id')
check('course owner can submit a transfer request', response.status_code == 201 and bool(request_id), response.status_code)

response = client.get('/api/instructor/course-transfers', headers=auth(new_token))
incoming = (response.get_json() or {}).get('incoming', [])
check('selected instructor receives the transfer request',
      response.status_code == 200 and any(row.get('id') == request_id for row in incoming))

response = client.post(f'/api/instructor/course-transfers/{request_id}/respond',
                       json={'decision': 'accept'}, headers=auth(new_token))
check('recipient can accept the transfer', response.status_code == 200, response.status_code)

response = client.post(f'/api/admin/course-transfers/{request_id}/decision',
                       json={'decision': 'approve', 'unpaid_earnings_action': 'keep_original'},
                       headers=auth(admin_token))
check('Admin can approve an accepted transfer', response.status_code == 200, response.status_code)

with app.app_context():
    db = get_db()
    course = db.execute("SELECT instructor_id,instructor_name,original_instructor_id FROM courses WHERE id='course-transfer-1'").fetchone()
    session = db.execute("SELECT instructor_id FROM live_sessions WHERE id='session-transfer-1'").fetchone()
    coupon = db.execute("SELECT created_by FROM coupons WHERE id='coupon-transfer-1'").fetchone()
    transaction = db.execute("SELECT instructor_id,payout_status FROM transactions WHERE id='tx-transfer-1'").fetchone()
    history = db.execute("SELECT * FROM course_transfer_history WHERE course_id='course-transfer-1'").fetchall()
check('course ownership changes without changing course identity',
      bool(course and course['instructor_id'] == 'new1' and course['instructor_name'] == 'Receiving Instructor'))
check('original creator is retained for audit',
      bool(course and course['original_instructor_id'] == 'old1'))
check('live-session management transfers while session remains',
      bool(session and session['instructor_id'] == 'new1'))
check('course coupon management transfers to new owner',
      bool(coupon and coupon['created_by'] == 'new1'))
check('historical unpaid transaction stays with original instructor by default',
      bool(transaction and transaction['instructor_id'] == 'old1' and transaction['payout_status'] == 'pending'))
check('ownership history is recorded', len(history) == 1)

# After the course is transferred, account deletion can proceed.
response = client.delete('/api/users/account', json={'email': 'old-transfer@example.com'}, headers=auth(old_token))
check('former owner can delete account after transferring all courses',
      response.status_code == 200, response.status_code)

# Recipient must be active and approved; arbitrary students cannot receive a course.
response = client.post('/api/instructor/course-transfers', json={
    'course_id': 'course-transfer-1', 'recipient_id': 'student1', 'reason': 'Invalid recipient test.'
}, headers=auth(new_token))
check('student account cannot receive course ownership', response.status_code == 400, response.status_code)

print()
if failures:
    print(f'{len(failures)} CHECK(S) FAILED: {failures}')
    sys.exit(1)
print('ALL COURSE-TRANSFER CHECKS PASSED')
