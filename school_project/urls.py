"""
URL configuration for school_project project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView

urlpatterns = [
    # Default Django backend/admin UI
    path('admin/', admin.site.urls),

    # Opening http://127.0.0.1:8000/ now goes to the default Django admin UI.
    path('', RedirectView.as_view(pattern_name='admin:index', permanent=False)),

    # Keep the accounts/API routes for the React/mobile frontend.
    path('accounts/', include('accounts.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
