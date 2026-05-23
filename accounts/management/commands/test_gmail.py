from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError

from accounts.email_utils import get_sanitized_email_settings


class Command(BaseCommand):
    help = 'Send a real test email using the current Django email settings.'

    def add_arguments(self, parser):
        parser.add_argument('recipient', help='Email address that should receive the test message.')

    def handle(self, *args, **options):
        recipient = options['recipient']
        self.stdout.write('Current email settings:')
        for key, value in get_sanitized_email_settings().items():
            self.stdout.write(f'  {key}: {value}')

        if not settings.EMAIL_HOST_USER:
            raise CommandError('EMAIL_HOST_USER is empty. Put your Gmail address in .env.')
        if not settings.EMAIL_HOST_PASSWORD:
            raise CommandError('EMAIL_HOST_PASSWORD is empty. Put your 16-character Google App Password in .env.')
        if settings.EMAIL_USE_TLS and settings.EMAIL_USE_SSL:
            raise CommandError('EMAIL_USE_TLS and EMAIL_USE_SSL cannot both be True. Use TLS=True with port 587 for Gmail.')

        sent = send_mail(
            subject='Django Gmail SMTP Test',
            message='If you received this email, Gmail SMTP is working in your Django project.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        self.stdout.write(self.style.SUCCESS(f'Sent {sent} test email to {recipient}. Check Inbox, Spam, and All Mail.'))
