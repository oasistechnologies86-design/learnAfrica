"""Regression checks for the dedicated reset email without changing OTP mail."""
import os
import importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    'email_service_under_test', os.path.join(HERE, 'app', 'email_service.py'))
email_service = importlib.util.module_from_spec(spec)
spec.loader.exec_module(email_service)

link = 'https://example.test/reset-password?token=abc&source=email'
html = email_service.render_password_reset_email(
    link=link, expiry='1 hour', support_email='help@example.test')

assert 'Reset my password' in html
assert 'max-width:480px' in html
assert 'padding:12px 22px' in html
assert 'border-top:' not in html
assert 'abc&amp;source=email' in html
assert 'href="https://example.test/reset-password?token=abc&amp;source=email"' in html
assert 'help@example.test' in html
assert 'This link expires in 1 hour' in html

# The shared renderer used by registration OTP remains unchanged and functional.
otp_html = email_service.render_email(
    'Verify your email', '<p>Enter the code below.</p>', code='123456')
assert '123456' in otp_html
assert 'LearnAfrica' in otp_html

# The already-supported invalid_grant fallback remains explicitly retryable.
assert email_service._retryable('Google token refresh failed: 400 invalid_grant')
assert not email_service._retryable('Gmail send failed: 400 invalid recipient')

print('PASS dedicated reset template, escaping, and unchanged OTP renderer')
print('PASS invalid_grant failover classification and terminal recipient handling')
