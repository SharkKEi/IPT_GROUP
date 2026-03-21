from django.urls import path
from django.views.generic import RedirectView

from .views import SchoolLoginView
from .views_api import (
    EnrollmentListCreateAPIView,
    EnrollmentDeleteAPIView,
    EnrollmentSummaryAPIView,
    LoginAPIView,
    SectionListCreateAPIView,
    SectionRetrieveUpdateAPIView,
    StudentListCreateAPIView,
    StudentRetrieveUpdateAPIView,
    SubjectListCreateAPIView,
    SubjectRetrieveUpdateAPIView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('', RedirectView.as_view(pattern_name='login', permanent=False), name='accounts_root'),
    path('login/', SchoolLoginView.as_view(), name='login'),
    path('api/login/', LoginAPIView.as_view(), name='api_login'),

    # ── Students ───────────────────────────────────────────────────────────────
    path('api/students/', StudentListCreateAPIView.as_view(), name='api_students'),
    path('api/students/<int:pk>/', StudentRetrieveUpdateAPIView.as_view(), name='api_student_update'),

    # ── Subjects ───────────────────────────────────────────────────────────────
    path('api/subjects/', SubjectListCreateAPIView.as_view(), name='api_subjects'),
    path('api/subjects/<int:pk>/', SubjectRetrieveUpdateAPIView.as_view(), name='api_subject_update'),

    # ── Sections ───────────────────────────────────────────────────────────────
    path('api/sections/', SectionListCreateAPIView.as_view(), name='api_sections'),
    path('api/sections/<int:pk>/', SectionRetrieveUpdateAPIView.as_view(), name='api_section_update'),

    # ── Enrollments ────────────────────────────────────────────────────────────
    path('api/enrollments/', EnrollmentListCreateAPIView.as_view(), name='api_enrollments'),
    path('api/enrollments/<int:pk>/', EnrollmentDeleteAPIView.as_view(), name='api_enrollment_delete'),
    path('api/enrollment-summary/', EnrollmentSummaryAPIView.as_view(), name='api_enrollment_summary'),
]