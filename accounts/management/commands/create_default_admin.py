import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounts.models import UserProfile


class Command(BaseCommand):
    help = "Create a default admin user for local development."

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
        password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
        email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@example.com")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_active": True, "is_staff": True, "is_superuser": True},
        )

        user.email = email
        user.set_password(password)
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save(update_fields=["email", "password", "is_active", "is_staff", "is_superuser"])

        profile, _ = UserProfile.objects.get_or_create(user=user)
        if not profile.is_email_verified:
            profile.is_email_verified = True
            profile.activation_token = None
            profile.save(update_fields=["is_email_verified", "activation_token"])

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} default admin user: {username}"))
