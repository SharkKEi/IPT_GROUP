from django.urls import path
from .views import SchoolLoginView
from .views_api import LoginAPIView

urlpatterns = [
    path('login/', SchoolLoginView.as_view(), name='login'),
    path('api/login/', LoginAPIView.as_view(), name='api_login'),
]
