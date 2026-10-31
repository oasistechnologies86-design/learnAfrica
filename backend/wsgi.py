import eventlet
eventlet.monkey_patch()

import os, sys, traceback
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.main import socketio
from app.database import init_db, get_db
from app.crud import seed_admin, seed_demo_courses, seed_instructor_guide

# Create the Flask app
flask_app = create_app()

# Initialise database (idempotent — creates tables IF NOT EXISTS, runs
# ADD COLUMN IF NOT EXISTS migrations) before serving traffic. A database/schema
# failure is fatal: serving requests against a missing or partially migrated
# schema can corrupt data or fail unpredictably. Optional seed failures are logged
# and do not prevent the service from starting.
def _safe_step(label, fn):
    try:
        fn()
        print(f'✅ startup: {label}')
    except Exception as e:
        print(f'❌ startup: {label} FAILED — {e}')
        traceback.print_exc(file=sys.stdout)

with flask_app.app_context():
    init_db(flask_app)  # Fail startup if required schema/database initialization fails.
    print('✅ startup: init_db')
    _safe_step('seed_admin',           lambda: seed_admin(flask_app, get_db()))
    _safe_step('seed_demo_courses',    lambda: seed_demo_courses(flask_app, get_db()))
    _safe_step('seed_instructor_guide',lambda: seed_instructor_guide(flask_app, get_db()))

app = flask_app
