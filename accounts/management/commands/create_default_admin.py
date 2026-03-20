from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create default admin user (username: admin, password: admin123) if missing."

    def handle(self, *args, **options):
        User = get_user_model()

        username = "admin"
        password = "admin123"
        email = "admin@example.com"

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_active": True, "is_staff": True, "is_superuser": True},
        )

        if created:
            user.set_password(password)
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
            user.save(update_fields=["password", "is_active", "is_staff", "is_superuser"])
            self.stdout.write(self.style.SUCCESS(f"Created default admin user: {username}"))
        else:
            # Keep environments repeatable for students: ensure the password matches.
            user.set_password(password)
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
            user.save(update_fields=["password", "is_active", "is_staff", "is_superuser"])
            self.stdout.write(self.style.SUCCESS(f"Updated default admin credentials for: {username}"))

