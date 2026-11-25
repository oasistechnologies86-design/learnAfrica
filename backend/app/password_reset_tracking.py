"""Audit metadata and safe timestamp serialization for password-reset requests.

This module wraps the existing password-reset routes without changing their
security checks or delivery behaviour. It records the handling path and event
timestamps, and enriches the admin list with student names and ISO timestamps.
"""
import json
import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from functools import wraps

from flask import jsonify, make_response, request

from .database import get_db, ensure_column


def _ensure_columns(db):
    ensure_column(db, 'password_reset_requests', 'handling_method', 'TEXT')
    ensure_column(db, 'password_reset_requests', 'email_sent_at', 'TIMESTAMP')
    ensure_column(db, 'password_reset_requests', 'link_generated_at', 'TIMESTAMP')
    ensure_column(db, 'password_reset_requests', 'last_action_at', 'TIMESTAMP')
    ensure_column(db, 'password_reset_requests', 'fallback_at', 'TIMESTAMP')


def _utc_now_sql():
    return 'CURRENT_TIMESTAMP'


def _as_iso_utc(value):
    """Normalize database, ISO, and Flask HTTP-date timestamps to UTC ISO-8601."""
    if value is None or value == '':
        return None
    if isinstance(value, datetime):
        parsed = value
    else:
        raw = str(value).strip()
        if not raw:
            return None
        parsed = None
        # Flask's default JSON provider serializes datetime as RFC 2822.
        try:
            parsed = parsedate_to_datetime(raw)
        except (TypeError, ValueError, OverflowError):
            pass
        if parsed is None:
            normalized = raw.replace(' ', 'T', 1) if ' ' in raw and 'T' not in raw else raw
            if normalized.endswith(('Z', 'z')):
                normalized = normalized[:-1] + '+00:00'
            try:
                parsed = datetime.fromisoformat(normalized)
            except (TypeError, ValueError, OverflowError):
                return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


def _response_json(result):
    response = make_response(result)
    payload = response.get_json(silent=True)
    return response, payload


def register_password_reset_tracking(app):
    """Attach audit metadata around the established password-reset endpoints."""
    def wrap(endpoint, after):
        original = app.view_functions.get(endpoint)
        if original is None:
            app.logger.warning('Password-reset tracking: endpoint %s was not found', endpoint)
            return

        @wraps(original)
        def wrapped(*args, **kwargs):
            result = original(*args, **kwargs)
            try:
                return after(result, *args, **kwargs)
            except Exception:
                app.logger.exception('Password-reset tracking failed for %s', endpoint)
                return result

        app.view_functions[endpoint] = wrapped

    def after_forgot(result, *args, **kwargs):
        response, payload = _response_json(result)
        email = (request.get_json(silent=True) or {}).get('email', '').strip().lower()
        if not payload or not email:
            return result
        db = get_db()
        _ensure_columns(db)
        row = db.execute(
            'SELECT id, status, handling_method FROM password_reset_requests WHERE LOWER(email)=? ORDER BY created_at DESC LIMIT 1',
            (email,),
        ).fetchone()
        if not row:
            return result
        delivery = payload.get('delivery_status')
        if delivery == 'manual_fallback' or row['status'] == 'manual_fallback':
            method = 'manual_fallback'
        elif delivery == 'email_sent':
            # An admin may email a link for a request originally created in
            # Manual Mode. Keep that origin classification; otherwise record
            # the automatic-email path.
            method = row['handling_method'] if row['handling_method'] in ('manual_mode', 'manual_fallback') else 'automatic_email'
        elif row['status'] == 'email_sent' and row['handling_method']:
            method = row['handling_method']
        elif payload.get('mode') == 'manual':
            method = 'manual_mode'
        else:
            return result
        db.execute(
            'UPDATE password_reset_requests SET handling_method=?, last_action_at={now} WHERE id=?'.format(now=_utc_now_sql()),
            (method, row['id']),
        )
        if delivery == 'manual_fallback' or row['status'] == 'manual_fallback':
            db.execute(
                'UPDATE password_reset_requests SET fallback_at=COALESCE(fallback_at, {now}) WHERE id=?'.format(now=_utc_now_sql()),
                (row['id'],),
            )
        if delivery == 'email_sent':
            db.execute(
                'UPDATE password_reset_requests SET email_sent_at={now} WHERE id=?'.format(now=_utc_now_sql()),
                (row['id'],),
            )
        db.commit()
        return result

    def after_list(result, *args, **kwargs):
        response, payload = _response_json(result)
        if not isinstance(payload, dict) or not isinstance(payload.get('requests'), list):
            return result
        db = get_db()
        _ensure_columns(db)
        enriched = []
        for item in payload['requests']:
            row = dict(item)
            if not row.get('student_name'):
                user = db.execute(
                    'SELECT name FROM users WHERE LOWER(email)=LOWER(?) LIMIT 1',
                    (row.get('email') or '',),
                ).fetchone()
                row['student_name'] = user['name'] if user else ''
            method = row.get('handling_method')
            if method not in ('manual_mode', 'automatic_email', 'manual_fallback'):
                status = row.get('status')
                method = (
                    'manual_fallback' if status == 'manual_fallback' or row.get('delivery_error') or row.get('fallback_at') else
                    'automatic_email' if status in ('email_sent', 'link_sent') else
                    'manual_mode' if status in ('pending', 'link_generated') else
                    'legacy_unknown'
                )
            row['effective_handling_method'] = method
            for field in ('created_at', 'email_sent_at', 'link_generated_at', 'last_action_at', 'fallback_at', 'resolved_at'):
                row[field + '_iso'] = _as_iso_utc(row.get(field))
            enriched.append(row)
        payload['requests'] = enriched
        response.set_data(json.dumps(payload))
        response.headers['Content-Type'] = 'application/json'
        return response

    def after_generate(result, rid, *args, **kwargs):
        response, payload = _response_json(result)
        if response.status_code < 400:
            db = get_db()
            _ensure_columns(db)
            db.execute(
                'UPDATE password_reset_requests SET link_generated_at={now}, last_action_at={now} WHERE id=?'.format(now=_utc_now_sql()),
                (rid,),
            )
            db.commit()
        return result

    def after_email(result, rid, *args, **kwargs):
        response, payload = _response_json(result)
        if response.status_code < 400:
            db = get_db()
            _ensure_columns(db)
            db.execute(
                "UPDATE password_reset_requests SET status='email_sent', email_sent_at={now}, last_action_at={now}, delivery_error=NULL WHERE id=?".format(now=_utc_now_sql()),
                (rid,),
            )
            db.commit()
        else:
            if payload and payload.get('delivery_error'):
                db = get_db()
                _ensure_columns(db)
                db.execute(
                    'UPDATE password_reset_requests SET delivery_error=?, last_action_at={now} WHERE id=?'.format(now=_utc_now_sql()),
                    (str(payload['delivery_error'])[:1000], rid),
                )
                db.commit()
        return result

    def after_dismiss(result, rid, *args, **kwargs):
        response, payload = _response_json(result)
        if response.status_code < 400:
            db = get_db()
            _ensure_columns(db)
            db.execute(
                'UPDATE password_reset_requests SET last_action_at={now} WHERE id=?'.format(now=_utc_now_sql()),
                (rid,),
            )
            db.commit()
        return result

    wrap('forgot_password', after_forgot)
    wrap('list_password_reset_requests', after_list)
    wrap('generate_password_reset_link', after_generate)
    wrap('email_password_reset_link', after_email)
    wrap('dismiss_password_reset_request', after_dismiss)
