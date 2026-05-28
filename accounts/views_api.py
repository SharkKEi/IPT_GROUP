import profile

from PIL.ImtImagePlugin import field
from django.contrib.auth import login, logout as auth_logout
from django.contrib.auth.models import User as AuthUser
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django_ratelimit.decorators import ratelimit
from rest_framework import request, status, generics
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Count, Sum
from django.conf import settings
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
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def get_csrf_token(request):
    """Securely hands the CSRF token to the frontend as JSON."""
    return JsonResponse({'csrftoken': get_token(request)})

API_AUTH = [SessionAuthentication, JWTAuthentication]


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

        # Handle extra profile fields (birthday, department, specialty)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        changed = []
        for field in ('department', 'specialty'):
            if field in request.POST:
                setattr(profile, field, request.POST[field] or '')
                changed.append(field)
        if 'birthday' in request.POST:
            val = request.POST['birthday']
            profile.birthday = val if val else None
            changed.append('birthday')
        if changed:
            profile.save(update_fields=changed)

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

        activation_url = f"{settings.FRONTEND_URL}/activate?uid={user.pk}&token={token}"
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
        token = request.query_params.get('token')
        uid = request.query_params.get('uid')
        if not token:
            return Response({'detail': 'Activation token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        profile = None

        if uid:
            try:
                profile = UserProfile.objects.select_related('user').get(user_id=uid)
            except (UserProfile.DoesNotExist, ValueError):
                return Response({'detail': 'Invalid activation link.'}, status=status.HTTP_400_BAD_REQUEST)

            if profile.is_email_verified:
                return Response({'message': 'Account is already activated. You can now log in.'}, status=status.HTTP_200_OK)

            if profile.activation_token != token:
                return Response({'detail': 'Invalid or expired activation token.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            try:
                profile = UserProfile.objects.select_related('user').get(activation_token=token)
            except UserProfile.DoesNotExist:
                return Response({'detail': 'Invalid or expired activation token.'}, status=status.HTTP_400_BAD_REQUEST)

        if not profile.is_token_valid():
            logger.warning(f'Expired token used for activation: {profile.user.username}')
            return Response({'detail': 'Activation token has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        user = profile.user
        user.is_active = True
        user.save(update_fields=['is_active'])
        profile.is_email_verified = True
        profile.activation_token = None
        profile.token_expires_at = None
        profile.save(update_fields=['is_email_verified', 'activation_token', 'token_expires_at'])

        return Response({'message': 'Account activated successfully. You can now log in.'}, status=status.HTTP_200_OK)


# ── Dev-only: instant activation (DEBUG only) ─────────────────────────────────

class DevActivateAPIView(APIView):
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
        activation_url = f"{settings.FRONTEND_URL}/activate?uid={user.pk}&token={token}"
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
    serializer_class = StudentSerializer
    pagination_class = None

    def get_queryset(self):
        return Student.objects.annotate(
            enrollment_count=Count("enrollments")
        ).order_by("student_number")


class StudentRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


# ── Subjects ──────────────────────────────────────────────────────────────────

class SubjectListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    serializer_class = SubjectSerializer
    pagination_class = None

    def get_queryset(self):
        return Subject.objects.annotate(
            section_count=Count("sections")
        ).order_by("subject_code")


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
    pagination_class = None


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