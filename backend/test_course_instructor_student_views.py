"""Integration checks for scoped student views and course financial summaries."""
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.environ.setdefault('SECRET_KEY', 'student-view-test-secret')

from app import create_app  # noqa: E402
import app.main as main_module  # noqa: E402
import app.payments as payments_module  # noqa: E402
import app.security as security_module  # noqa: E402
from app.database import init_db, get_db  # noqa: E402


_tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
_tmp.close()
_old_database_path = os.environ.get('DATABASE_PATH')
os.environ['DATABASE_PATH'] = _tmp.name

app = create_app()
app.config.update(TESTING=True, DATABASE=_tmp.name, USE_POSTGRES=False)

original_auth = security_module._authenticate
original_profile_check = main_module._instructor_profile_complete
current_user = None
failures = []


def check(name, condition, details=''):
    print(('PASS' if condition else 'FAIL') + ' - ' + name + (f' [{details}]' if details else ''))
    if not condition:
        failures.append(name)


try:
    with app.app_context():
        init_db(app)
        db = get_db()
        # Transactions are used by the course details' fee summary.
        from app.database import ensure_transactions_table, ensure_column
        ensure_transactions_table(db)
        ensure_column(db, 'transactions', 'paystack_fee', 'REAL DEFAULT 0')

        for uid, name, email, role in [
            ('admin-1', 'Admin', 'admin@example.test', 'admin'),
            ('instructor-a', 'Instructor A', 'a@example.test', 'instructor'),
            ('instructor-b', 'Instructor B', 'b@example.test', 'instructor'),
            ('student-1', 'Student One', 'one@example.test', 'student'),
            ('student-2', 'Student Two', 'two@example.test', 'student'),
            ('student-3', 'Student Three', 'three@example.test', 'student'),
            ('student-4', 'Student Four', 'four@example.test', 'student'),
        ]:
            db.execute(
                "INSERT INTO users (id,name,email,password_hash,role,is_active,token_version) "
                "VALUES (?,?,?,?,?,1,0)",
                (uid, name, email, 'not-used-in-this-test', role)
            )

        for cid, title, instructor_id, instructor_name in [
            ('course-a', 'Course A', 'instructor-a', 'Instructor A'),
            ('course-b', 'Course B', 'instructor-a', 'Instructor A'),
            ('course-c', 'Course C', 'instructor-b', 'Instructor B'),
        ]:
            db.execute(
                "INSERT INTO courses (id,title,description,instructor_id,instructor_name,category,"
                "difficulty,price,is_free,is_published,is_visible) "
                "VALUES (?,?, 'Description', ?, ?, 'Technology','beginner',100,0,1,1)",
                (cid, title, instructor_id, instructor_name)
            )

        for eid, student_id, course_id, progress in [
            ('enrol-1', 'student-1', 'course-a', 100),
            ('enrol-2', 'student-2', 'course-a', 25),
            ('enrol-3', 'student-3', 'course-b', 0),
            ('enrol-4', 'student-4', 'course-c', 60),
        ]:
            db.execute(
                "INSERT INTO user_enrollments (id,user_id,course_id,progress,enrolled_at) "
                "VALUES (?,?,?, ?, CURRENT_TIMESTAMP)",
                (eid, student_id, course_id, progress)
            )

        transactions = [
            ('tx-1', 'receipt-1', 'student-1', 'course-a', 'instructor-a', 150, 88, 59, 'success', 'paystack', 3),
            ('tx-2', 'receipt-2', 'student-2', 'course-a', 'instructor-a', 75, 0, 0, 'pending', 'paystack', 0),
            ('tx-3', 'receipt-3', 'student-3', 'course-b', 'instructor-a', 100, 58, 40, 'success', 'paystack', 2),
            ('tx-4', 'receipt-4', 'student-4', 'course-c', 'instructor-b', 200, 120, 80, 'success', 'paystack', 4),
        ]
        for tx in transactions:
            db.execute(
                "INSERT INTO transactions (id,receipt_id,type,user_id,course_id,instructor_id,"
                "amount,instructor_share,platform_share,status,provider,paystack_fee) "
                "VALUES (?,?,'purchase',?,?,?,?,?,?,?,?,?)",
                tx
            )
        db.execute(
            "INSERT INTO transactions (id,receipt_id,type,user_id,amount,instructor_share,"
            "platform_share,status,provider,paystack_fee) "
            "VALUES ('tx-refund','receipt-refund','instructor_registration','admin-1',20,0,20,'refunded','paystack',0)"
        )
        db.commit()

    app_client = app.test_client()
    security_module._authenticate = lambda: (current_user, None)
    main_module._instructor_profile_complete = lambda _db, _uid: True

    # Admin course list feeds the View Students financial summary.
    current_user = {'user_id': 'admin-1', 'email': 'admin@example.test', 'role': 'admin'}

    # Dated Paystack fee policy applies platform-wide unless an instructor override is active.
    policy_response = app_client.put('/api/admin/paystack-fee-policy', json={
        'default_rate_pct': 1.95, 'effective_from': __import__('datetime').datetime.utcnow().date().isoformat()
    })
    check('admin can save a dated global Paystack fee rate', policy_response.status_code == 200, policy_response.get_json())
    policy_payload = app_client.get('/api/admin/paystack-fee-policy').get_json() or {}
    check('global Paystack policy is explicitly scoped to all instructors',
          policy_payload.get('default_rate_pct') == 1.95 and policy_payload.get('apply_scope') == 'all_instructors',
          policy_payload)

    override_response = app_client.put('/api/admin/instructors/instructor-a/paystack-fee-policy', json={
        'rate_pct': 2.5, 'effective_from': '2099-02-01'
    })
    check('admin can save an instructor-specific fee and effective date',
          override_response.status_code == 200, override_response.get_json())
    current_user = {'user_id': 'instructor-a', 'email': 'a@example.test', 'role': 'instructor'}
    instructor_policy = app_client.get('/api/instructor/paystack-fee-policy').get_json() or {}
    check('instructor sees the active default and its scheduled custom override',
          instructor_policy.get('rate_pct') == 1.95 and (instructor_policy.get('scheduled_override') or {}).get('rate_pct') == 2.5 and (instructor_policy.get('scheduled_override') or {}).get('effective_from') == '2099-02-01',
          instructor_policy)
    current_user = {'user_id': 'instructor-b', 'email': 'b@example.test', 'role': 'instructor'}
    default_policy = app_client.get('/api/instructor/paystack-fee-policy').get_json() or {}
    check('instructor without override inherits the platform default',
          default_policy.get('rate_pct') == 1.95 and default_policy.get('source') == 'platform_default',
          default_policy)

    # A new Paystack course purchase uses the active global policy provisionally.
    original_initiate_payment = payments_module.initiate_payment
    payments_module.initiate_payment = lambda **kwargs: {
        'id': 'paystack-estimate-test', 'receipt_id': 'receipt-estimate-test',
        'provider': 'paystack', 'provider_ref': 'ref-estimate-test',
        'checkout_url': 'https://checkout.example.test', 'status': 'pending'
    }
    current_user = {'user_id': 'student-4', 'email': 'four@example.test', 'role': 'student'}
    purchase_response = app_client.post('/api/courses/course-a/purchase', json={'payment_method': 'card'})
    with app.app_context():
        estimate_tx = get_db().execute(
            "SELECT paystack_fee_estimate, paystack_fee_status, instructor_share, platform_share "
            "FROM transactions WHERE id='paystack-estimate-test'"
        ).fetchone()
        check('new Paystack purchase stores a provisional fee estimate',
              purchase_response.status_code in (200, 201) and estimate_tx is not None
              and round(float(estimate_tx['paystack_fee_estimate'] or 0), 2) == 1.95
              and estimate_tx['paystack_fee_status'] == 'estimated',
              dict(estimate_tx) if estimate_tx else purchase_response.get_json())
        check('provisional fee is deducted before the existing revenue split',
              estimate_tx is not None and round(float(estimate_tx['instructor_share'] or 0)
              + float(estimate_tx['platform_share'] or 0), 2) == 98.05,
              dict(estimate_tx) if estimate_tx else '')
    payments_module.initiate_payment = original_initiate_payment

    current_user = {'user_id': 'admin-1', 'email': 'admin@example.test', 'role': 'admin'}
    response = app_client.get('/api/admin/courses')
    course_list = response.get_json() or {}
    course_a = next((c for c in course_list.get('courses', []) if c['id'] == 'course-a'), {})
    check('admin course list includes correct gross', response.status_code == 200 and course_a.get('gross_revenue') == 150.0, course_a.get('gross_revenue'))
    check('admin course list includes Paystack fee and net totals', course_a.get('paystack_fees') == 3.0 and course_a.get('net_after_paystack') == 147.0, course_a)

    response = app_client.get('/api/admin/courses/course-a/students?per_page=1&page=1')
    payload = response.get_json() or {}
    check('admin course student view is scoped and paginated', response.status_code == 200 and payload.get('count') == 2 and len(payload.get('students', [])) == 1 and payload.get('total_pages') == 2, payload)
    summary = payload.get('summary') or {}
    check('admin course student view reports fee-first breakdown', summary.get('gross_revenue') == 150.0 and summary.get('paystack_fees') == 3.0 and summary.get('net_after_paystack') == 147.0, summary)

    response = app_client.get('/api/admin/courses/course-a/students?payment=paid')
    payload = response.get_json() or {}
    check('course student view filters paid enrolments', response.status_code == 200 and payload.get('count') == 1 and payload['students'][0]['student_id'] == 'student-1', payload.get('students'))

    response = app_client.get('/api/admin/courses/course-a/students?progress=completed')
    payload = response.get_json() or {}
    check('course student view filters completed learners', response.status_code == 200 and payload.get('count') == 1 and payload['students'][0]['student_id'] == 'student-1', payload.get('students'))

    response = app_client.get('/api/admin/instructors/instructor-a/students')
    payload = response.get_json() or {}
    check('admin instructor view includes only that instructor’s course enrolments', response.status_code == 200 and payload.get('count') == 3, payload.get('count'))

    response = app_client.get('/api/admin/financial-records')
    payload = response.get_json() or {}
    check('admin financial overview reports transactions marked refunded separately',
          response.status_code == 200 and payload.get('refunded_transaction_count') == 1
          and payload.get('refunded_transaction_value') == 20.0, payload)

    # Instructor may see all their own students, but cannot open another
    # instructor's course student list.
    current_user = {'user_id': 'instructor-a', 'email': 'a@example.test', 'role': 'instructor', 'instructor_status': 'approved'}
    response = app_client.get('/api/instructor/students')
    payload = response.get_json() or {}
    check('instructor dashboard student list spans all owned courses', response.status_code == 200 and payload.get('count') == 3, payload.get('count'))
    statuses = {row['student_id']: row.get('payment_status') for row in payload.get('students', [])}
    check('instructor student rows include their payment status', statuses.get('student-1') == 'success' and statuses.get('student-2') == 'pending', statuses)

    response = app_client.get('/api/instructor/courses/course-a/students')
    payload = response.get_json() or {}
    check('instructor course View Students is scoped to the selected course', response.status_code == 200 and payload.get('count') == 2, payload.get('count'))

    response = app_client.get('/api/instructor/courses/course-c/students')
    check('instructor cannot view another instructor’s course students', response.status_code == 403, response.status_code)

    current_user = {'user_id': 'instructor-b', 'email': 'b@example.test', 'role': 'instructor', 'instructor_status': 'approved'}
    response = app_client.get('/api/instructor/courses/course-a/students')
    check('different instructor remains blocked from the course student view', response.status_code == 403, response.status_code)

    current_user = {'user_id': 'student-1', 'email': 'one@example.test', 'role': 'student'}
    response = app_client.get('/api/admin/courses/course-a/students')
    check('student account cannot access admin student lists', response.status_code == 403, response.status_code)

finally:
    security_module._authenticate = original_auth
    main_module._instructor_profile_complete = original_profile_check
    if _old_database_path is None:
        os.environ.pop('DATABASE_PATH', None)
    else:
        os.environ['DATABASE_PATH'] = _old_database_path
    try:
        os.unlink(_tmp.name)
    except OSError:
        pass

if failures:
    print(f'{len(failures)} CHECK(S) FAILED: {failures}')
    sys.exit(1)
print('ALL STUDENT VIEW CHECKS PASSED')
