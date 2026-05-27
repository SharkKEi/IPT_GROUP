import logging

from django.contrib.auth import login, logout as auth_logout
from django.contrib.auth.models import User as AuthUser
from django.db.models import Count, Sum
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework import generics, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .chatbot import get_chatbot_reply
from .email_utils import send_activation_email
from .jwt_serializers import user_payload
from .models import Enrollment, Section, Student, Subject, UserProfile
from .permissions import CanManageSchoolData, IsAdminRole
from .serializers import (
    ChatMessageSerializer,
    EnrollmentSerializer,
    LoginSerializer,
    RegisterSerializer,
    SectionSerializer,
    StudentSerializer,
    SubjectSerializer,
)

logger = logging.getLogger(__name__)

API_AUTH = [SessionAuthentication]


# ── Auth ──────────────────────────────────────────────────────────────────────


@method_decorator(csrf_exempt, name='dispatch')
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

        return Response(
            {
                'message': 'Login successful',
                'user': user_payload(user, request),
            },
            status=status.HTTP_200_OK,
        )


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
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.first_name = first_name
        user.last_name = last_name
        user.email = email
        user.save(update_fields=['first_name', 'last_name', 'email'])

        if 'profile_picture' in request.FILES:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.profile_picture = request.FILES['profile_picture']
            profile.save(update_fields=['profile_picture'])

        return Response(user_payload(user, request))


@method_decorator(csrf_exempt, name='dispatch')
class RegisterAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token = user.profile.activation_token
        activation_url = f"{request.build_absolute_uri('/')}activate?token={token}"
        # Prefer frontend URL if present
        try:
            from django.conf import settings

            activation_url = f"{settings.FRONTEND_URL}/activate?token={token}"
        except Exception:
            pass

        try:
            send_activation_email(user, activation_url)
        except Exception as e:
            logger.exception('Failed to send activation email to %s', user.email)
            return Response(
                {
                    'detail': 'Account was created, but the activation email could not be sent.',
                    'email_error': str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        msg = (
            'Registration successful. Please check your email to activate your account.'
            if getattr(request, 'REQUIRE_EMAIL_VERIFICATION', False)
            else 'Registration successful. You can log in now.'
        )

        return Response({'detail': msg, 'username': user.username}, status=status.HTTP_201_CREATED)


class ActivateAccountAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({'detail': 'Activation token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        profile = get_object_or_404(UserProfile, activation_token=token)
        if not profile.is_token_valid():
            return Response({'detail': 'Activation token has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        user = profile.user
        user.is_active = True
        user.save(update_fields=['is_active'])

        profile.is_email_verified = True
        profile.activation_token = None
        profile.token_expires_at = None
        profile.save(update_fields=['is_email_verified', 'activation_token', 'token_expires_at'])

        return Response({'message': 'Account activated successfully.'}, status=status.HTTP_200_OK)


class DevActivateAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, username):
        from django.conf import settings

        if not settings.DEBUG:
            return Response({'detail': 'Not available in production.'}, status=status.HTTP_403_FORBIDDEN)

        user = AuthUser.objects.get(username=username)
        user.is_active = True
        user.save(update_fields=['is_active'])

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.is_email_verified = True
        profile.activation_token = None
        profile.token_expires_at = None
        profile.save(update_fields=['is_email_verified', 'activation_token', 'token_expires_at'])

        return Response({'detail': f'Account "{username}" activated successfully.'}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
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
            return Response({'detail': 'If that email is registered, an activation link has been sent.'}, status=status.HTTP_200_OK)

        profile = user.profile
        if profile.is_email_verified:
            return Response({'detail': 'This account is already activated.'}, status=status.HTTP_200_OK)

        token = profile.generate_activation_token()
        from django.conf import settings

        activation_url = f"{settings.FRONTEND_URL}/activate?token={token}"
        send_activation_email(user, activation_url)
        return Response({'detail': 'Activation email sent. Please check your inbox.'}, status=status.HTTP_200_OK)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfCookieAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({'detail': 'CSRF cookie set'})


# ── Chatbot ──────────────────────────────────────────────────────────────────


class ChatbotAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = []

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reply = get_chatbot_reply(serializer.validated_data['message'], request.user.username)
        return Response({'reply': reply, 'message': serializer.validated_data['message']})


# ── Students/Subjects/Sections/Enrollments ─────────────────────────────────


class StudentListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Student.objects.all().order_by('student_number')
    serializer_class = StudentSerializer


class StudentRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


class SubjectListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Subject.objects.all().order_by('subject_code')
    serializer_class = SubjectSerializer


class SubjectRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


class SectionListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Section.objects.all().select_related('subject').order_by('subject__subject_code', 'section_code')
    serializer_class = SectionSerializer


class SectionRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Section.objects.all()
    serializer_class = SectionSerializer


class EnrollmentListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH
    queryset = Enrollment.objects.all().select_related('student', 'subject', 'section').order_by('-created_at')
    serializer_class = EnrollmentSerializer


class EnrollmentDeleteAPIView(APIView):
    permission_classes = [CanManageSchoolData]
    authentication_classes = API_AUTH

    def delete(self, request, pk):
        enrollment = get_object_or_404(Enrollment, pk=pk)
        student_name = enrollment.student.full_name
        subject_code = enrollment.subject.subject_code
        enrollment.delete()
        return Response({'detail': f'Successfully dropped {student_name} from {subject_code}.'}, status=status.HTTP_200_OK)


class EnrollmentSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = API_AUTH

    def get(self, request):
        total_units = Enrollment.objects.aggregate(total=Sum('subject__units')).get('total') or 0

        per_student = (
            Student.objects.all()
            .annotate(
                units_total=Sum('enrollments__subject__units'),
                subjects_enrolled=Count('enrollments', distinct=True),
            )
            .order_by('-units_total')
        )

        per_subject = (
            Subject.objects.all()
            .annotate(
                students_enrolled=Count('enrollments', distinct=True),
                units_total=Sum('enrollments__subject__units'),
            )
            .order_by('subject_code')
        )

        return Response(
            {
                'total_enrollments': Enrollment.objects.count(),
                'total_enrolled_units': total_units,
                'per_student': [
                    {
                        'student_id': s.student_number,
                        'full_name': s.full_name,
                        'subjects_enrolled': s.subjects_enrolled,
                        'units_total': s.units_total or 0,
                    }
                    for s in per_student
                ],
                'per_subject': [
                    {
                        'subject_code': sub.subject_code,
                        'title': sub.title,
                        'students_enrolled': sub.students_enrolled,
                        'units_total': sub.units_total or 0,
                    }
                    for sub in per_subject
                ],
            },
            status=status.HTTP_200_OK,
        )


class UserListAPIView(APIView):
    permission_classes = [IsAdminRole]
    authentication_classes = API_AUTH

    def get(self, request):
        users = AuthUser.objects.select_related('profile').order_by('username')
        return Response([user_payload(u, request) for u in users])


class UserRoleUpdateAPIView(APIView):
    permission_classes = [IsAdminRole]
    authentication_classes = API_AUTH

    def patch(self, request, pk):
        role = request.data.get('role', '').lower()
        if role not in ('admin', 'staff', 'user'):
            return Response({'detail': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(AuthUser, pk=pk)
        if user == request.user and role != 'admin':
            return Response({'detail': 'You cannot demote your own admin access.'}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.save(update_fields=['role'])

        user.is_staff = role in ('admin', 'staff')
        user.is_superuser = role == 'admin'
        user.save(update_fields=['is_staff', 'is_superuser'])

        return Response(user_payload(user, request))

