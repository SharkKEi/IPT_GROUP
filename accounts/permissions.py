from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAuthenticatedOrReadOnlyInDebug(BasePermission):
    """Allow unauthenticated reads only when DEBUG is enabled (legacy dev)."""

    def has_permission(self, request, view):
        from django.conf import settings

        if request.method in SAFE_METHODS and settings.DEBUG:
            return True
        return request.user and request.user.is_authenticated


class HasRole(BasePermission):
    allowed_roles = []

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else 'user'
        return role in self.allowed_roles


class IsAdminRole(HasRole):
    allowed_roles = ['admin']


class IsStaffOrAdmin(HasRole):
    allowed_roles = ['admin', 'staff']


class CanManageSchoolData(BasePermission):
    """Staff and admin can write; all authenticated users can read."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        return profile and profile.role in ('admin', 'staff')
