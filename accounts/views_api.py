from django.contrib.auth import login, logout as auth_logout
from django.contrib.auth.models import User as AuthUser
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django_ratelimit.decorators import ratelimit
from rest_framework import status, generics
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Count, Sum
from django.conf import settings
from django.http import HttpResponse
from django.urls import reverse
from urllib.parse import urlencode
import logging

logger = logging.getLogger(__name__)

from .chatbot import get_chatbot_reply
from .jwt_serializers import user_payload
from .email_utils import send_activation_email
from .models import Enrollment, Section, Student, Subject, UserProfile
from .permissions import CanManageSchoolData, IsAdminRole
from .serializers import (
    ChatMessageSerializer,
    EnrollmentSerializer,
    SectionSerializer,
    StudentSerializer,
    SubjectSerializer,
    LoginSerializer,
    RegisterSerializer,
)

API_AUTH = [SessionAuthentication, JWTAuthentication]


def build_activation_url(request, user, token):
    """Build a backend activation URL that works even if the React activation page crashes."""
    query = urlencode({'uid': user.pk, 'token': token})
    return request.build_absolute_uri(f"{reverse('browser_activate')}?{query}")


def activate_profile(uid, token):
    """Activate an account. Returns (ok, message). Safe to call more than once."""
    if not token:
        return False, 'Activation token is missing.'

    profile = None
    if uid:
        try:
            profile = UserProfile.objects.select_related('user').get(user_id=uid)
        except (UserProfile.DoesNotExist, ValueError):
            return False, 'Invalid activation link.'

        # If already activated, treat it as success. This avoids React StrictMode/double-click issues.
        if profile.is_email_verified:
            return True, 'Account is already activated. You can now log in.'

        if profile.activation_token != token:
            return False, 'Invalid or expired activation token.'
    else:
        try:
            profile = UserProfile.objects.select_related('user').get(activation_token=token)
        except UserProfile.DoesNotExist:
            return False, 'Invalid or expired activation token.'

    if not profile.is_token_valid():
        logger.warning('Expired token used for activation: %s', profile.user.username)
        return False, 'Activation token has expired. Please request a new one.'

    user = profile.user
    user.is_active = True
    user.save(update_fields=['is_active'])

    profile.is_email_verified = True
    profile.activation_token = None
    profile.token_expires_at = None
    profile.save(update_fields=['is_email_verified', 'activation_token', 'token_expires_at'])

    return True, 'Account activated successfully. You can now log in.'


def activation_result_html(success, message):
    color = '#34d399' if success else '#f87171'
    icon = '✓' if success else '✗'
    title = 'Account Activated' if success else 'Activation Failed'
    login_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>{title}</title>
  <style>
    body {{ margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; font-family:Arial,sans-serif; background:linear-gradient(135deg,#100c2b,#1e0b4d,#130b39); color:white; padding:24px; }}
    .card {{ width:100%; max-width:460px; text-align:center; background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.16); border-radius:28px; padding:42px 32px; box-shadow:0 24px 70px rgba(0,0,0,.35); }}
    .icon {{ margin:0 auto 22px; width:74px; height:74px; border-radius:999px; display:flex; align-items:center; justify-content:center; border:1px solid {color}; color:{color}; background:rgba(255,255,255,.08); font-size:40px; }}
    h1 {{ margin:0 0 12px; font-size:34px; }}
    p {{ color:rgba(255,255,255,.74); line-height:1.6; }}
    a {{ display:block; margin-top:28px; padding:15px 18px; border-radius:18px; background:linear-gradient(135deg,#3b82f6,#9333ea); color:white; text-decoration:none; font-weight:700; }}
  </style>
</head>
<body>
  <main class=\"card\">
    <div class=\"icon\">{icon}</div>
    <h1>{title}</h1>
    <p>{message}</p>
    <a href=\"{login_url}\">Back to Login</a>
  </main>
</body>
</html>"""


# ── Auth ──────────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(ratelimit(key='ip', rate='5/m', method='POST'), name='dispatch')
class LoginAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        remember_me = request.data.get('remember')
        if not bool(remember_me):
            request.session.set_expiry(0)
        return Response({
            'message': 'Login successful',
            'user': user_payload(user, request),
        }, status=status.HTTP_200_OK)


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auth_logout(request)
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(user_payload(request.user, request))

    def patch(self, request):
        user = request.user

        first_name = request.data.get('first_name', user.first_name)
        last_name = request.data.get('last_name', user.last_name)
        email = request.data.get('email', user.email)

        if email != user.email and AuthUser.objects.filter(email=email).exclude(pk=user.pk).exists():
            return Response(
                {'detail': 'Email already in use by another account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.first_name = first_name
        user.last_name = last_name
        user.email = email
        user.save(update_fields=['first_name', 'last_name', 'email'])

        if 'profile_picture' in request.FILES:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.profile_picture = request.FILES['profile_picture']
            profile.save(update_fields=['profile_picture'])

        profile_picture_url = None
        if hasattr(user, 'profile') and user.profile.profile_picture:
            profile_picture_url = request.build_absolute_uri(user.profile.profile_picture.url)

        return Response(user_payload(user, request))


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(ratelimit(key='ip', rate='3/h', method='POST'), name='dispatch')
class RegisterAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        profile = user.profile
        token = profile.activation_token

        activation_url = build_activation_url(request, user, token)
        try:
            send_activation_email(user, activation_url)
        except Exception as e:
            logger.exception('Failed to send activation email to %s', user.email)
            return Response({
                'detail': 'Account was created, but the activation email could not be sent. Check your Gmail SMTP settings and try resend activation.',
                'email_error': str(e),
                'username': user.username,
                'requires_activation': getattr(settings, 'REQUIRE_EMAIL_VERIFICATION', False),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if getattr(settings, 'REQUIRE_EMAIL_VERIFICATION', False):
            message = 'Registration successful. Please check your email to activate your account.'
        else:
            message = 'Registration successful. You can log in now. An activation email was also sent for your records.'

        return Response({
            'detail': message,
            'username': user.username,
            'requires_activation': getattr(settings, 'REQUIRE_EMAIL_VERIFICATION', False),
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class ActivateAccountAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        ok, message = activate_profile(
            request.query_params.get('uid'),
            request.query_params.get('token'),
        )
        status_code = status.HTTP_200_OK if ok else status.HTTP_400_BAD_REQUEST
        key = 'message' if ok else 'detail'
        return Response({key: message}, status=status_code)


class BrowserActivateAccountView(APIView):
    """Browser-friendly activation endpoint used by email links."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        ok, message = activate_profile(
            request.query_params.get('uid'),
            request.query_params.get('token'),
        )
        return HttpResponse(activation_result_html(ok, message))

# ── Dev-only: instant activation (DEBUG only) ─────────────────────────────────

class DevActivateAPIView(APIView):
    """
    Development shortcut — instantly activates an account by username.
    Only works when DEBUG=True. Remove or disable in production.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, username):
        if not settings.DEBUG:
            return Response({'detail': 'Not available in production.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            from django.contrib.auth.models import User as AuthUser
            user = AuthUser.objects.get(username=username)
        except AuthUser.DoesNotExist:
            return Response({'detail': f'User "{username}" not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.is_active = True
        user.save(update_fields=['is_active'])

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.is_email_verified = True
        profile.activation_token = None
        profile.token_expires_at = None
        profile.save(update_fields=['is_email_verified', 'activation_token', 'token_expires_at'])

        return Response({
            'detail': f'Account "{username}" activated successfully.',
            'username': username,
            'is_active': True,
            'is_email_verified': True,
        }, status=status.HTTP_200_OK)


# ── CSRF cookie (SPA) ─────────────────────────────────────────────────────────

@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfCookieAPIView(APIView):
    """Sets csrftoken cookie for the React app (session-authenticated requests)."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({'detail': 'CSRF cookie set'})


# ── Chatbot ───────────────────────────────────────────────────────────────────

class ChatbotAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = API_AUTH

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reply = get_chatbot_reply(serializer.validated_data['message'], request.user.username)
        return Response({'reply': reply, 'message': serializer.validated_data['message']})


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(ratelimit(key='ip', rate='5/h', method='POST'), name='dispatch')
class ResendActivationAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = AuthUser.objects.get(email=email)
        except AuthUser.DoesNotExist:
            return Response(
                {'detail': 'If that email is registered, an activation link has been sent.'},
                status=status.HTTP_200_OK,
            )
        profile = user.profile
        if profile.is_email_verified:
            return Response({'detail': 'This account is already activated.'}, status=status.HTTP_200_OK)
        token = profile.generate_activation_token()
        activation_url = build_activation_url(request, user, token)
        try:
            send_activation_email(user, activation_url)
        except Exception as e:
            logger.exception('Failed to resend activation email to %s', user.email)
            return Response({
                'detail': 'Activation email could not be sent. Check your Gmail SMTP settings.',
                'email_error': str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'detail': 'Activation email sent. Please check your inbox.'})


# ── Students ──────────────────────────────────────────────────────────────────

class StudentListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Student.objects.all().order_by("student_number")
    serializer_class = StudentSerializer
    pagination_class = None  # Will use DEFAULT from settings


class StudentRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


# ── Subjects ──────────────────────────────────────────────────────────────────

class SubjectListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Subject.objects.all().order_by("subject_code")
    serializer_class = SubjectSerializer
    pagination_class = None  # Will use DEFAULT from settings


class SubjectRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


# ── Sections ──────────────────────────────────────────────────────────────────

class SectionListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Section.objects.all().select_related("subject").order_by("subject__subject_code", "section_code")
    serializer_class = SectionSerializer
    pagination_class = None  # Will use DEFAULT from settings


class SectionRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Section.objects.all()
    serializer_class = SectionSerializer


# ── Enrollments ───────────────────────────────────────────────────────────────

class EnrollmentListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Enrollment.objects.all().select_related("student", "subject", "section").prefetch_related().order_by("-created_at")
    serializer_class = EnrollmentSerializer


class EnrollmentDeleteAPIView(APIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH

    def delete(self, request, pk):
        try:
            enrollment = Enrollment.objects.get(pk=pk)
        except Enrollment.DoesNotExist:
            return Response({"detail": "Enrollment not found."}, status=status.HTTP_404_NOT_FOUND)
        student_name = enrollment.student.full_name
        subject_code = enrollment.subject.subject_code
        enrollment.delete()
        logger.info(f'Enrollment deleted: {student_name} from {subject_code}')
        return Response(
            {"detail": f"Successfully dropped {student_name} from {subject_code}."},
            status=status.HTTP_200_OK
        )


# ── Enrollment Summary ────────────────────────────────────────────────────────

class EnrollmentSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = API_AUTH

    def get(self, request):
        total_units = Enrollment.objects.aggregate(total=Sum("subject__units")).get("total") or 0
        per_student = (
            Student.objects.all()
            .annotate(
                units_total=Sum("enrollments__subject__units"),
                subjects_enrolled=Count("enrollments", distinct=True),
            )
            .order_by("-units_total")
        )
        per_subject = (
            Subject.objects.all()
            .annotate(
                students_enrolled=Count("enrollments", distinct=True),
                units_total=Sum("enrollments__subject__units"),
            )
            .order_by("subject_code")
        )
        return Response({
            "total_enrollments": Enrollment.objects.count(),
            "total_enrolled_units": total_units,
            "per_student": [
                {
                    "student_id": s.student_number,
                    "full_name": s.full_name,
                    "subjects_enrolled": s.subjects_enrolled,
                    "units_total": s.units_total or 0,
                }
                for s in per_student
            ],
            "per_subject": [
                {
                    "subject_code": sub.subject_code,
                    "title": sub.title,
                    "students_enrolled": sub.students_enrolled,
                    "units_total": sub.units_total or 0,
                }
                for sub in per_subject
            ],
        }, status=status.HTTP_200_OK)


class UserListAPIView(APIView):
    """Admin-only: list portal users."""
    permission_classes = [IsAdminRole]
    authentication_classes = API_AUTH

    def get(self, request):
        users = AuthUser.objects.select_related('profile').order_by('username')
        return Response([user_payload(u, request) for u in users])


class UserRoleUpdateAPIView(APIView):
    """Admin-only: update a user's role."""
    permission_classes = [IsAdminRole]
    authentication_classes = API_AUTH

    def patch(self, request, pk):
        role = request.data.get('role', '').lower()
        if role not in ('admin', 'staff', 'user'):
            return Response(
                {'detail': 'Invalid role. Use admin, staff, or user.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = AuthUser.objects.get(pk=pk)
        except AuthUser.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user == request.user and role != 'admin':
            return Response(
                {'detail': 'You cannot demote your own admin access.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.save(update_fields=['role'])
        user.is_staff = role in ('admin', 'staff')
        user.is_superuser = role == 'admin'
        user.save(update_fields=['is_staff', 'is_superuser'])
        return Response(user_payload(user, request))