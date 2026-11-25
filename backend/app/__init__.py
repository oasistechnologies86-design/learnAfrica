"""
LearnAfrica — Flask Backend
Package entry point. Import the create_app factory to get the Flask app instance.
"""
from .main import create_app as _create_app


def create_app(*args, **kwargs):
    app = _create_app(*args, **kwargs)
    from .password_reset_tracking import register_password_reset_tracking
    register_password_reset_tracking(app)
    return app


__all__ = ['create_app']
