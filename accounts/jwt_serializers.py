from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


def user_payload(user, request=None):
    profile_picture = None
    role = 'user'
    is_email_verified = True
    if hasattr(user, 'profile'):
        if user.profile.profile_picture:
            if request:
                profile_picture = request.build_absolute_uri(user.profile.profile_picture.url)
            else:
                profile_picture = user.profile.profile_picture.url
        role = user.profile.role
        is_email_verified = user.profile.is_email_verified
    if user.is_superuser:
        role = 'admin'
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
        'role': role,
        'date_joined': user.date_joined,
        'last_login': user.last_login,
        'profile_picture': profile_picture,
        'is_email_verified': is_email_verified,
    }


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if getattr(settings, 'REQUIRE_EMAIL_VERIFICATION', False):
            if hasattr(user, 'profile') and not user.profile.is_email_verified:
                raise serializers.ValidationError(
                    'Account is not activated. Please check your email.'
                )
            if not user.is_active:
                raise serializers.ValidationError(
                    'Account is not activated. Please check your email.'
                )
        request = self.context.get('request')
        data['user'] = user_payload(user, request)
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        role = 'user'
        if hasattr(user, 'profile'):
            role = user.profile.role
        if user.is_superuser:
            role = 'admin'
        token['role'] = role
        token['username'] = user.username
        return token
