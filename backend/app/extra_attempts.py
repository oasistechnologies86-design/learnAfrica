"""Paid one-at-a-time quiz attempt purchases.

Each verified GHS 10 payment creates exactly one additional attempt credit for
the quiz. Credits are keyed to the payment transaction, so webhook retries
cannot issue duplicate attempts. The existing course enrolment is never changed.
"""
import json
import uuid

from flask import Blueprint, request, jsonify, g
from .database import get_db, ensure_transactions_table
from .security import token_required
from .payments import initiate_payment

extra_attempts_bp = Blueprint("extra_attempts", __name__)


def ensure_extra_attempts_table(db):
    db.execute("""
        CREATE TABLE IF NOT EXISTS quiz_attempt_credits (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL UNIQUE,
            user_id TEXT NOT NULL,
            quiz_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            instructor_id TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'GHS',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db.commit()


def extra_attempt_count(db, user_id, quiz_id):
    ensure_extra_attempts_table(db)
    row = db.execute(
        "SELECT COUNT(*) AS cnt FROM quiz_attempt_credits WHERE user_id=? AND quiz_id=?",
        (user_id, quiz_id)
    ).fetchone()
    return int(row["cnt"] or 0) if row else 0


def settle_extra_attempt(db, transaction_id):
    """Grant one credit for a successful extra-attempt transaction; idempotent."""
    ensure_transactions_table(db)
    ensure_extra_attempts_table(db)
    tx = db.execute(
        "SELECT * FROM transactions WHERE id=? AND type='quiz_extra_attempt'",
        (transaction_id,)
    ).fetchone()
    if not tx or tx["status"] != "success":
        return False
    quiz_id = None
    try:
        details = json.loads(tx["payment_details"] or "{}")
        quiz_id = details.get("quiz_id")
    except Exception:
        quiz_id = None
    if not quiz_id or not tx["user_id"] or not tx["course_id"] or not tx["instructor_id"]:
        return False
    existing = db.execute(
        "SELECT id FROM quiz_attempt_credits WHERE transaction_id=?",
        (transaction_id,)
    ).fetchone()
    if existing:
        return True
    db.execute(
        """INSERT INTO quiz_attempt_credits
           (id,transaction_id,user_id,quiz_id,course_id,instructor_id,amount,currency)
           VALUES(?,?,?,?,?,?,?,?)""",
        (str(uuid.uuid4()), transaction_id, tx["user_id"], quiz_id,
         tx["course_id"], tx["instructor_id"], float(tx["amount"] or 0),
         tx["currency"] or "GHS")
    )
    db.commit()
    return True


@extra_attempts_bp.route("/api/quizzes/<quiz_id>/extra-attempt/purchase", methods=["POST"])
@token_required
def purchase_extra_attempt(quiz_id):
    db = get_db()
    try:
        if g.current_user.get("role") != "student":
            return jsonify({"error": "Only students can purchase an extra attempt."}), 403
        ensure_transactions_table(db)
        ensure_extra_attempts_table(db)
        uid = g.current_user["user_id"]
        quiz = db.execute(
            "SELECT id,course_id,lesson_id,title FROM quizzes WHERE id=?",
            (quiz_id,)
        ).fetchone()
        if not quiz:
            return jsonify({"error": "Quiz not found."}), 404
        enrolled = db.execute(
            "SELECT 1 FROM user_enrollments WHERE user_id=? AND course_id=?",
            (uid, quiz["course_id"])
        ).fetchone()
        if not enrolled:
            return jsonify({"error": "You must be enrolled in this course."}), 403
        lesson = db.execute(
            "SELECT is_final FROM lessons WHERE id=? AND course_id=?",
            (quiz["lesson_id"], quiz["course_id"])
        ).fetchone() if quiz["lesson_id"] else None
        max_attempts = int((db.execute(
            "SELECT max_attempts FROM quizzes WHERE id=?", (quiz_id,)
        ).fetchone() or {}).get("max_attempts") or (10 if lesson and lesson["is_final"] else 0))
        if max_attempts <= 0:
            return jsonify({"error": "This quiz has unlimited attempts; no purchase is required."}), 400
        used = db.execute(
            "SELECT COUNT(*) AS cnt FROM quiz_attempts WHERE user_id=? AND quiz_id=?",
            (uid, quiz_id)
        ).fetchone()
        credits = extra_attempt_count(db, uid, quiz_id)
        if int(used["cnt"] or 0) < max_attempts + credits:
            return jsonify({"error": "You still have an available attempt."}), 409
        course = db.execute(
            "SELECT id,title,instructor_id FROM courses WHERE id=?",
            (quiz["course_id"],)
        ).fetchone()
        if not course or not course["instructor_id"]:
            return jsonify({"error": "The course instructor could not be identified."}), 409
        user = db.execute("SELECT id,name,email FROM users WHERE id=?", (uid,)).fetchone()
        if not user:
            return jsonify({"error": "Student account not found."}), 404
        body = request.get_json(silent=True) or {}
        method = body.get("payment_method") or "any"
        details = body.get("payment_details") or {}
        details = {
            "quiz_id": quiz_id,
            "quiz_title": quiz["title"],
            "name": str(details.get("name") or user["name"] or "")[:120],
            "phone": str(details.get("phone") or "")[:40],
            "city": str(details.get("city") or "")[:80],
        }
        amount = 10.00
        from .payments import generate_receipt_id
        from .payments import _provider_name
        pay = initiate_payment(
            user={"id": uid, "name": user["name"], "email": user["email"]},
            course={"id": course["id"], "title": "Additional quiz attempt: " + str(quiz["title"])},
            amount=amount, currency="GHS", payment_method=method,
            payment_details=details
        )
        if pay.get("error") or (pay.get("provider") == "paystack" and not pay.get("checkout_url")):
            return jsonify({"error": pay.get("error") or "Payment checkout could not be started."}), 502
        tx_details = dict(details)
        tx_details["purpose"] = "quiz_extra_attempt"
        db.execute(
            """INSERT INTO transactions
               (id,receipt_id,type,user_id,user_name,user_email,course_id,course_title,
                instructor_id,amount,currency,instructor_share,platform_share,status,
                provider,provider_ref,payment_method,payment_details,payout_status,notes)
               VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (pay["id"], pay["receipt_id"], "quiz_extra_attempt", uid, user["name"],
             user["email"], course["id"], "Additional quiz attempt: " + str(quiz["title"]),
             course["instructor_id"], amount, "GHS", amount, 0.0, pay["status"],
             pay["provider"], pay["provider_ref"], method, json.dumps(tx_details),
             "pending", "One additional attempt for quiz " + quiz_id)
        )
        db.commit()
        if pay["status"] == "success":
            settle_extra_attempt(db, pay["id"])
        return jsonify({
            "transaction_id": pay["id"], "receipt_id": pay["receipt_id"],
            "status": pay["status"], "checkout_url": pay.get("checkout_url") or "",
            "amount": amount, "currency": "GHS",
            "message": "One additional attempt is ready." if pay["status"] == "success"
                       else "Complete payment to unlock one additional attempt."
        }), 201
    except Exception as exc:
        try:
            db.rollback()
        except Exception:
            pass
        import logging
        logging.exception("Additional quiz attempt purchase failed")
        return jsonify({"error": "Could not start the additional-attempt payment."}), 500


def init_extra_attempts(app):
    app.register_blueprint(extra_attempts_bp)
