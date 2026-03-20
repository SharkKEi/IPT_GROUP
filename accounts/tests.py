from django.test import TestCase
from rest_framework.serializers import ValidationError as DRFValidationError

from django.contrib.auth import get_user_model
from django.test.client import Client
import re

from .models import Enrollment, Section, Student, Subject
from .serializers import EnrollmentSerializer


class EnrollmentRulesTests(TestCase):
    def setUp(self):
        self.subject = Subject.objects.create(subject_code="MATH101", title="Math 101", units=3)
        self.section_a = Section.objects.create(subject=self.subject, section_code="A", capacity=1)
        self.section_b = Section.objects.create(subject=self.subject, section_code="B", capacity=1)

        self.s1 = Student.objects.create(student_number="S-001", full_name="Alice M.")
        self.s2 = Student.objects.create(student_number="S-002", full_name="Bob N.")
        self.s3 = Student.objects.create(student_number="S-003", full_name="Cathy O.")

    def test_prevent_duplicate_enrollment(self):
        serializer = EnrollmentSerializer(data={"student": self.s1.id, "subject": self.subject.id})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        dup_serializer = EnrollmentSerializer(data={"student": self.s1.id, "subject": self.subject.id})
        self.assertFalse(dup_serializer.is_valid())
        # DRF may surface either our custom ValidationError or the model-level
        # unique constraint error message. Either way, duplicates are blocked.
        self.assertIn("unique", str(dup_serializer.errors).lower())

    def test_section_capacity_is_enforced(self):
        # Fill both available sections (capacity=1 each).
        serializer1 = EnrollmentSerializer(data={"student": self.s1.id, "subject": self.subject.id})
        serializer1.is_valid(raise_exception=True)
        serializer1.save()

        serializer2 = EnrollmentSerializer(data={"student": self.s2.id, "subject": self.subject.id})
        serializer2.is_valid(raise_exception=True)
        serializer2.save()

        self.assertEqual(Enrollment.objects.filter(subject=self.subject).count(), 2)

        # Third student should fail due to lack of capacity.
        serializer3 = EnrollmentSerializer(data={"student": self.s3.id, "subject": self.subject.id})
        serializer3.is_valid(raise_exception=True)
        with self.assertRaises(DRFValidationError):
            serializer3.save()


class DjangoLoginTemplateTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="admin",
            password="admin123",
        )
        # Ensure the form can login the user even if it's not staff.
        self.client = Client()

    def test_login_page_csrf_and_login(self):
        # Load login page to receive CSRF token cookie + form token.
        resp = self.client.get("/accounts/login/")
        self.assertEqual(resp.status_code, 200)

        html = resp.content.decode("utf-8")
        m = re.search(r'name="csrfmiddlewaretoken"\s+value="([^"]+)"', html)
        self.assertIsNotNone(m, "CSRF token not found in login page HTML")
        csrf_token = m.group(1)

        resp2 = self.client.post(
            "/accounts/login/",
            {
                "csrfmiddlewaretoken": csrf_token,
                "username": "admin",
                "password": "admin123",
            },
            follow=False,
        )

        # Successful login redirects to LOGIN_REDIRECT_URL ('/').
        self.assertIn(resp2.status_code, (302, 303))
        self.assertIn("/admin/", resp2["Location"])
