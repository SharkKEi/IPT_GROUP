"""
URL configuration for school_project project.
"""

<<<<<<< HEAD
<<<<<<< HEAD
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', RedirectView.as_view(pattern_name='login', permanent=False)),
    path('accounts', RedirectView.as_view(pattern_name='login', permanent=False)),
=======
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
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
<<<<<<< HEAD
>>>>>>> 56b74d6 (Updated project code)
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
    path('accounts/', include('accounts.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
