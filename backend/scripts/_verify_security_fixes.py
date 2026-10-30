"""End-to-end checks for the two security fixes, against the real Flask app.

Run:  .venv-test/bin/python /tmp/test_enroll_fix.py
"""
import os, tempfile, uuid, sys

os.environ['FLASK_ENV'] = 'development'
os.environ['SECRET_KEY'] = 'test-secret-not-for-production'
os.environ['DATABASE_PATH'] = os.path.join(tempfile.mkdtemp(), 'test.db')
os.environ.pop('DATABASE_URL', None)

sys.path.insert(0, '/workspace/project/larepo/backend')

from app.main import create_app
from app.database import init_db, get_db
from app.security import generate_token

app = create_app()
with app.app_context():
    init_db(app)

db_path = app.config['DATABASE']
print('db:', db_path)

FAILS = []
def check(name, ok, extra=''):
    print(('PASS' if ok else 'FAIL') + ' - ' + name + (f' [{extra}]' if extra else ''))
    if not ok:
        FAILS.append(name)

instructor_id = 'inst-1'
student_id = 'stud-1'
paid_id = 'course-paid'
free_id = 'course-free'

with app.app_context():
    db = get_db()
    db.execute("INSERT INTO users (id,name,email,password_hash,role,instructor_status,is_active) "
               "VALUES (?,?,?,?,?,?,1)",
               (instructor_id, 'Inst', 'inst@example.com', 'x', 'instructor', 'approved'))
    db.execute("INSERT INTO users (id,name,email,password_hash,role,is_active) "
               "VALUES (?,?,?,?,?,1)",
               (student_id, 'Stud', 'stud@example.com', 'x', 'student'))
    db.execute("INSERT INTO courses (id,title,description,instructor_id,instructor_name,price,is_free,is_published,is_visible) "
               "VALUES (?,?,?,?,?,?,0,1,1)",
               (paid_id, 'Paid Course', 'desc', instructor_id, 'Inst', 100.0))
    db.execute("INSERT INTO courses (id,title,description,instructor_id,instructor_name,price,is_free,is_published,is_visible) "
               "VALUES (?,?,?,?,?,0,1,1,1)",
               (free_id, 'Free Course', 'desc', instructor_id, 'Inst'))
    db.commit()

    # Quiz lesson for the progress test (on the free course)
    db.execute("INSERT INTO lessons (id,course_id,title,type,\"order\") VALUES (?,?,?,?,1)",
               ('quiz-1', free_id, 'Final Quiz', 'quiz'))
    db.commit()
    student_token = generate_token(student_id, 'stud@example.com', 'student', 0)

client = app.test_client()
H = {'Authorization': f'Bearer {student_token}'}

# 1. Paid course direct enroll must be refused (the bypass we fixed).
r = client.post(f'/api/courses/{paid_id}/enroll', headers=H)
check('paid course /enroll refused', r.status_code == 402, f'status={r.status_code} body={r.get_json()}')

# 2. No enrollment row was created for the paid course.
with app.app_context():
    row = get_db().execute('SELECT 1 FROM user_enrollments WHERE user_id=? AND course_id=?',
                           (student_id, paid_id)).fetchone()
check('paid course not enrolled', row is None)

# 3. Free course direct enroll still works (must not break existing behaviour).
r = client.post(f'/api/courses/{free_id}/enroll', headers=H)
check('free course /enroll works', r.status_code == 200, f'status={r.status_code} body={r.get_json()}')
with app.app_context():
    row = get_db().execute('SELECT 1 FROM user_enrollments WHERE user_id=? AND course_id=?',
                           (student_id, free_id)).fetchone()
check('free course enrolled', row is not None)

# 4. Anonymous paid course fetch must not leak lesson content/video.
r = client.get(f'/api/courses/{paid_id}')
cd = (r.get_json() or {}).get('course', {})
leaked = any([cd.get('video_url'), cd.get('content'), cd.get('sections'), cd.get('lessons')])
check('paid course content withheld from anonymous', (not leaked) and cd.get('locked') is True,
      f'locked={cd.get("locked")}')

# 4b. A student already enrolled in a paid course (e.g. purchased earlier) must
#     still get the idempotent 200, not the new 402 — no regression.
enrolled_id = 'stud-2'
with app.app_context():
    db = get_db()
    db.execute("INSERT INTO users (id,name,email,password_hash,role,is_active) "
               "VALUES (?,?,?,?,?,1)",
               (enrolled_id, 'Stud2', 'stud2@example.com', 'x', 'student'))
    db.execute("INSERT INTO user_enrollments (id,user_id,course_id,progress) VALUES (?,?,?,0)",
               ('enr-1', enrolled_id, paid_id))
    db.commit()
    enrolled_token = generate_token(enrolled_id, 'stud2@example.com', 'student', 0)
H2 = {'Authorization': f'Bearer {enrolled_token}'}
r = client.post(f'/api/courses/{paid_id}/enroll', headers=H2)
check('already-enrolled paid student still gets 200', r.status_code == 200,
      f'status={r.status_code} body={r.get_json()}')

# 5. Fake quiz score via /api/progress/update must not be recorded.
r = client.post('/api/progress/update', headers=H,
                json={'course_id': free_id, 'lesson_id': 'quiz-1', 'quiz_score': 100})
check('fake score update returns 200 without grading', r.status_code == 200, f'status={r.status_code}')
with app.app_context():
    p = get_db().execute('SELECT is_completed, quiz_score FROM user_progress '
                         'WHERE user_id=? AND course_id=? AND lesson_id=?',
                         (student_id, free_id, 'quiz-1')).fetchone()
    score = p['quiz_score'] if p else None
check('client-supplied quiz score ignored', score is None, f'quiz_score={score}')

print()
print('ALL CHECKS PASSED' if not FAILS else f'{len(FAILS)} CHECK(S) FAILED: {FAILS}')
sys.exit(0 if not FAILS else 1)
