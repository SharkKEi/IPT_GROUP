from django.contrib.auth import login, logout as auth_logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Sum
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

from .models import Enrollment, Section, Student, Subject, UserProfile
from .serializers import (
    EnrollmentSerializer,
    SectionSerializer,
    StudentSerializer,
    SubjectSerializer,
    LoginSerializer,
    RegisterSerializer,
)


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
        return Response({'message': 'Login successful', 'user': user.username}, status=status.HTTP_200_OK)


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auth_logout(request)
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile_picture = None
        if hasattr(user, 'profile') and user.profile.profile_picture:
            profile_picture = request.build_absolute_uri(user.profile.profile_picture.url)
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
            'profile_picture': profile_picture,
            'is_email_verified': user.profile.is_email_verified if hasattr(user, 'profile') else True,
        })


@method_decorator(csrf_exempt, name='dispatch')
class RegisterAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        profile = user.profile
        token = profile.activation_token

        activation_url = f"{request.scheme}://{request.get_host()}/activate?token={token}"

        html_message = render_to_string('emails/activation.html', {
            'username': user.username,
            'activation_url': activation_url,
        })
        plain_message = strip_tags(html_message)

        send_mail(
            subject='Activate Your School Portal Account',
            message=plain_message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@schoolportal.local'),
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

        return Response({
            'message': 'Registration successful. Please check your email to activate your account.',
            'username': user.username,
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class ActivateAccountAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({'detail': 'Activation token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            profile = UserProfile.objects.get(activation_token=token)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Invalid or expired activation token.'}, status=status.HTTP_400_BAD_REQUEST)

        user = profile.user
        user.is_active = True
        user.save(update_fields=['is_active'])
        profile.is_email_verified = True
        profile.activation_token = None
        profile.save(update_fields=['is_email_verified', 'activation_token'])

        return Response({'message': 'Account activated successfully. You can now log in.'}, status=status.HTTP_200_OK)


# ── Students ──────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name="dispatch")
class StudentListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Student.objects.all().order_by("student_number")
    serializer_class = StudentSerializer


@method_decorator(csrf_exempt, name="dispatch")
class StudentRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


# ── Subjects ──────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name="dispatch")
class SubjectListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Subject.objects.all().order_by("subject_code")
    serializer_class = SubjectSerializer


@method_decorator(csrf_exempt, name="dispatch")
class SubjectRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


# ── Sections ──────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name="dispatch")
class SectionListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Section.objects.all().select_related("subject").order_by("subject__subject_code", "section_code")
    serializer_class = SectionSerializer


@method_decorator(csrf_exempt, name="dispatch")
class SectionRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Section.objects.all()
    serializer_class = SectionSerializer


# ── Enrollments ───────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name="dispatch")
class EnrollmentListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Enrollment.objects.all().select_related("student", "subject", "section").order_by("created_at")
    serializer_class = EnrollmentSerializer


@method_decorator(csrf_exempt, name="dispatch")
class EnrollmentDeleteAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def delete(self, request, pk):
        try:
            enrollment = Enrollment.objects.get(pk=pk)
        except Enrollment.DoesNotExist:
            return Response({"detail": "Enrollment not found."}, status=status.HTTP_404_NOT_FOUND)
        student_name = enrollment.student.full_name
        subject_code = enrollment.subject.subject_code
        enrollment.delete()
        return Response(
            {"message": f"Successfully dropped {student_name} from {subject_code}."},
            status=status.HTTP_200_OK
        )


# ── Enrollment Summary ────────────────────────────────────────────────────────

class EnrollmentSummaryAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

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

