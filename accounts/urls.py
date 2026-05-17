from django.urls import path
from django.views.generic import RedirectView

from .views import SchoolLoginView
from .views_auth import CustomTokenObtainPairView, CustomTokenRefreshView
from .views_api import (
    ChatbotAPIView,
    CsrfCookieAPIView,
    EnrollmentListCreateAPIView,
    EnrollmentDeleteAPIView,
    EnrollmentSummaryAPIView,
    LoginAPIView,
    LogoutAPIView,
    MeAPIView,
    ResendActivationAPIView,
    SectionListCreateAPIView,
    SectionRetrieveUpdateDestroyAPIView,
    StudentListCreateAPIView,
    StudentRetrieveUpdateDestroyAPIView,
    SubjectListCreateAPIView,
    SubjectRetrieveUpdateDestroyAPIView,
    UserListAPIView,
    UserRoleUpdateAPIView,
    RegisterAPIView,
    ActivateAccountAPIView,
    DevActivateAPIView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('', RedirectView.as_view(pattern_name='login', permanent=False), name='accounts_root'),
    path('login/', SchoolLoginView.as_view(), name='login'),
    path('api/login/', LoginAPIView.as_view(), name='api_login'),
    path('api/logout/', LogoutAPIView.as_view(), name='api_logout'),
    path('api/me/', MeAPIView.as_view(), name='api_me'),
    path('api/csrf/', CsrfCookieAPIView.as_view(), name='api_csrf'),
    path('api/register/', RegisterAPIView.as_view(), name='api_register'),
    path('api/activate/', ActivateAccountAPIView.as_view(), name='api_activate'),
    path('api/resend-activation/', ResendActivationAPIView.as_view(), name='api_resend_activation'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='api_token'),
    path('api/token/refresh/', CustomTokenRefreshView.as_view(), name='api_token_refresh'),
    path('api/chatbot/', ChatbotAPIView.as_view(), name='api_chatbot'),
    path('api/users/', UserListAPIView.as_view(), name='api_users'),
    path('api/users/<int:pk>/role/', UserRoleUpdateAPIView.as_view(), name='api_user_role'),

    # ── Dev only: instant activation (DEBUG=True only) ────────────────────────
    path('api/dev/activate/<str:username>/', DevActivateAPIView.as_view(), name='api_dev_activate'),

    # ── Students ───────────────────────────────────────────────────────────────
    path('api/students/', StudentListCreateAPIView.as_view(), name='api_students'),
    path('api/students/<int:pk>/', StudentRetrieveUpdateDestroyAPIView.as_view(), name='api_student_detail'),

    # ── Subjects ───────────────────────────────────────────────────────────────
    path('api/subjects/', SubjectListCreateAPIView.as_view(), name='api_subjects'),
    path('api/subjects/<int:pk>/', SubjectRetrieveUpdateDestroyAPIView.as_view(), name='api_subject_detail'),

    # ── Sections ───────────────────────────────────────────────────────────────
    path('api/sections/', SectionListCreateAPIView.as_view(), name='api_sections'),
    path('api/sections/<int:pk>/', SectionRetrieveUpdateDestroyAPIView.as_view(), name='api_section_detail'),

    # ── Enrollments ────────────────────────────────────────────────────────────
    path('api/enrollments/', EnrollmentListCreateAPIView.as_view(), name='api_enrollments'),
    path('api/enrollments/<int:pk>/', EnrollmentDeleteAPIView.as_view(), name='api_enrollment_delete'),
    path('api/enrollment-summary/', EnrollmentSummaryAPIView.as_view(), name='api_enrollment_summary'),
]