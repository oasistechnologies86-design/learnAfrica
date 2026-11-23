"""Regression checks for instructor/admin access to their own student list."""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from app import create_app
import app.main as main_module
import app.security as security_module
import app.database as database_module


class Cursor:
    def __init__(self, rows):
        self.rows = rows

    def fetchall(self):
        return self.rows


class ScopedFakeDB:
    def __init__(self):
        self.last_sql = ''
        self.last_params = ()

    def execute(self, sql, params=()):
        self.last_sql = sql
        self.last_params = params
        owner_id = params[0] if params else None
        rows = [
            {'student_id': 'student-a', 'name': 'Student A', 'email': 'a@example.test',
             'phone': '', 'course_id': 'course-a', 'course_title': 'Course A',
             'progress': 45, 'enrolled_at': '2026-01-01'},
            {'student_id': 'student-b', 'name': 'Student B', 'email': 'b@example.test',
             'phone': '', 'course_id': 'course-b', 'course_title': 'Course B',
             'progress': 100, 'enrolled_at': '2026-01-02'},
        ]
        return Cursor(rows if owner_id == 'instructor-a' else [])


app = create_app()
app.config.update(TESTING=True)
db = ScopedFakeDB()
original_auth = security_module._authenticate
original_main_db = main_module.get_db
original_database_db = database_module.get_db
original_profile_check = main_module._instructor_profile_complete

try:
    main_module.get_db = lambda: db
    database_module.get_db = lambda: db
    main_module._instructor_profile_complete = lambda _db, _uid: True
    client = app.test_client()

    for role in ('instructor', 'admin'):
        security_module._authenticate = lambda role=role: (
            {'user_id': 'instructor-a', 'email': 'owner@example.test',
             'role': role, 'instructor_status': 'approved'}, None)
        response = client.get('/api/instructor/students')
        payload = response.get_json() or {}
        assert response.status_code == 200, (role, response.status_code, payload)
        assert payload.get('count') == 2, (role, payload)
        assert all(s['student_id'] in ('student-a', 'student-b')
                   for s in payload.get('students', []))
        assert 'WHERE c.instructor_id = ?' in db.last_sql
        assert 'LEFT JOIN issued_certificates ic' in db.last_sql
        assert 'ic.cert_id AS certificate_id' in db.last_sql
        assert db.last_params == ('instructor-a',)

    security_module._authenticate = lambda: (
        {'user_id': 'student-a', 'email': 'student@example.test',
         'role': 'student', 'instructor_status': None}, None)
    response = client.get('/api/instructor/students')
    assert response.status_code == 403, response.status_code

    print('PASS instructor and admin access is scoped to the authenticated instructor')
    print('PASS student role is denied')
finally:
    security_module._authenticate = original_auth
    main_module.get_db = original_main_db
    database_module.get_db = original_database_db
    main_module._instructor_profile_complete = original_profile_check
