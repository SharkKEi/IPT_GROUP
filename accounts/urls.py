from django.urls import path
from django.views.generic import RedirectView

from .views import SchoolLoginView
from .views_api import LoginAPIView

urlpatterns = [
    path('', RedirectView.as_view(pattern_name='login', permanent=False), name='accounts_root'),
    path('login/', SchoolLoginView.as_view(), name='login'),
    path('api/login/', LoginAPIView.as_view(), name='api_login'),
]
