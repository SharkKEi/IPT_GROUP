import logging
from typing import Dict

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def get_sanitized_email_settings() -> Dict[str, object]:
    """Return email settings that are safe to print in the terminal."""
    return {
        'EMAIL_BACKEND': getattr(settings, 'EMAIL_BACKEND', ''),
        'EMAIL_HOST': getattr(settings, 'EMAIL_HOST', ''),
        'EMAIL_PORT': getattr(settings, 'EMAIL_PORT', ''),
        'EMAIL_USE_TLS': getattr(settings, 'EMAIL_USE_TLS', False),
        'EMAIL_USE_SSL': getattr(settings, 'EMAIL_USE_SSL', False),
        'EMAIL_HOST_USER': getattr(settings, 'EMAIL_HOST_USER', ''),
        'EMAIL_HOST_PASSWORD_SET': bool(getattr(settings, 'EMAIL_HOST_PASSWORD', '')),
        'DEFAULT_FROM_EMAIL': getattr(settings, 'DEFAULT_FROM_EMAIL', ''),
        'REQUIRE_EMAIL_VERIFICATION': getattr(settings, 'REQUIRE_EMAIL_VERIFICATION', False),
        'FRONTEND_URL': getattr(settings, 'FRONTEND_URL', ''),
    }


def send_activation_email(user, activation_url: str) -> int:
    """Send the account activation email and raise the real SMTP error if it fails."""
    html_message = render_to_string('emails/activation.html', {
        'username': user.username,
        'activation_url': activation_url,
    })
    plain_message = strip_tags(html_message)

    return send_mail(
        subject='Activate Your School Portal Account',
        message=plain_message,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )
