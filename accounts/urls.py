from django.urls import path
from django.views.generic import RedirectView

from .views import SchoolLoginView
from .views_api import (
    EnrollmentListCreateAPIView,
    EnrollmentDeleteAPIView,
    EnrollmentSummaryAPIView,
    LoginAPIView,
    SectionListCreateAPIView,
    StudentListCreateAPIView,
    SubjectListCreateAPIView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('', RedirectView.as_view(pattern_name='login', permanent=False), name='accounts_root'),
    path('login/', SchoolLoginView.as_view(), name='login'),
    path('api/login/', LoginAPIView.as_view(), name='api_login'),

    # ── Enrollment API ─────────────────────────────────────────────────────────
    path('api/students/', StudentListCreateAPIView.as_view(), name='api_students'),
    path('api/subjects/', SubjectListCreateAPIView.as_view(), name='api_subjects'),
    path('api/sections/', SectionListCreateAPIView.as_view(), name='api_sections'),
    path('api/enrollments/', EnrollmentListCreateAPIView.as_view(), name='api_enrollments'),
    path('api/enrollments/<int:pk>/', EnrollmentDeleteAPIView.as_view(), name='api_enrollment_delete'),
    path('api/enrollment-summary/', EnrollmentSummaryAPIView.as_view(), name='api_enrollment_summary'),
]