from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import Student, UserProfile


class AuthAndRBACTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        self.admin = User.objects.create_user(
            username='admin2', email='a@test.com', password='pass12345', is_active=True
        )
        ap, _ = UserProfile.objects.get_or_create(user=self.admin)
        ap.role = UserProfile.Role.ADMIN
        ap.is_email_verified = True
        ap.save()

        self.user = User.objects.create_user(
            username='portaluser', email='u@test.com', password='pass12345', is_active=True
        )
        up, _ = UserProfile.objects.get_or_create(user=self.user)
        up.role = UserProfile.Role.USER
        up.is_email_verified = True
        up.save()

    def test_chatbot_requires_auth(self):
        res = self.client.post('/accounts/api/chatbot/', {'message': 'hello'}, format='json')
        self.assertIn(res.status_code, (401, 403))

    def test_chatbot_reply(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post('/accounts/api/chatbot/', {'message': 'hello'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('reply', res.data)

    def test_user_cannot_create_student(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post(
            '/accounts/api/students/',
            {'student_number': 'X1', 'full_name': 'Test'},
            format='json',
        )
        self.assertEqual(res.status_code, 403)

    def test_admin_can_create_student(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(
            '/accounts/api/students/',
            {'student_number': 'X2', 'full_name': 'Test Admin'},
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        self.assertTrue(Student.objects.filter(student_number='X2').exists())

    @override_settings(REQUIRE_EMAIL_VERIFICATION=True)
    def test_jwt_login_blocks_unverified(self):
        User = get_user_model()
        blocked = User.objects.create_user(
            username='blocked', email='b@test.com', password='pass12345', is_active=False
        )
        p, _ = UserProfile.objects.get_or_create(user=blocked)
        p.is_email_verified = False
        p.save()
        res = self.client.post(
            '/accounts/api/token/',
            {'username': 'blocked', 'password': 'pass12345'},
            format='json',
        )
        self.assertIn(res.status_code, (400, 401))
