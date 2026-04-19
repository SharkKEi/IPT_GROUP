from django.contrib.auth import login
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Sum

from .models import Enrollment, Section, Student, Subject
from .serializers import (
    EnrollmentSerializer,
    SectionSerializer,
    StudentSerializer,
    SubjectSerializer,
    LoginSerializer,
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


# ── Students ──────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name="dispatch")
class StudentListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Student.objects.all().order_by("student_number")
    serializer_class = StudentSerializer


# ── Subjects ──────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name="dispatch")
class SubjectListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Subject.objects.all().order_by("subject_code")
    serializer_class = SubjectSerializer


# ── Sections ──────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name="dispatch")
class SectionListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Section.objects.all().select_related("subject").order_by("subject__subject_code", "section_code")
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
    """DELETE /api/enrollments/{id}/ — drop/unenroll a student from a subject."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def delete(self, request, pk):
        try:
            enrollment = Enrollment.objects.get(pk=pk)
        except Enrollment.DoesNotExist:
            return Response(
                {"detail": "Enrollment not found."},
                status=status.HTTP_404_NOT_FOUND
            )
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