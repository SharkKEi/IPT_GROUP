from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.conf import settings

from .models import Enrollment, Section, Student, Subject, UserProfile


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if getattr(settings, 'REQUIRE_EMAIL_VERIFICATION', False):
                if hasattr(user, 'profile') and not user.profile.is_email_verified:
                    raise serializers.ValidationError(
                        'Account is not activated. Please check your email for the activation link.'
                    )
                if not user.is_active:
                    raise serializers.ValidationError(
                        'Account is not activated. Please check your email for the activation link.'
                    )
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password.')
        return attrs


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    confirm_password = serializers.CharField(min_length=6, write_only=True)
    profile_picture = serializers.ImageField(required=False, allow_empty_file=True)

    def validate_profile_picture(self, value):
        if value:
            # Max 5MB
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError('Profile picture must be under 5MB.')
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_email(self, value):
        validate_email(value)
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        picture = validated_data.pop('profile_picture', None)
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        require_verify = getattr(settings, 'REQUIRE_EMAIL_VERIFICATION', False)
        user = User.objects.create_user(**validated_data, is_active=not require_verify)
        user.set_password(password)
        user.save()
        profile = UserProfile.objects.create(user=user, role=UserProfile.Role.USER)
        if picture:
            profile.profile_picture = picture
            profile.save(update_fields=['profile_picture'])
        if not require_verify:
            profile.is_email_verified = True
            profile.save(update_fields=['is_email_verified'])
        profile.generate_activation_token()
        return user


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000, trim_whitespace=True)


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ["id", "student_number", "full_name", "created_at"]
        read_only_fields = ["id", "created_at"]


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "subject_code", "title", "units", "created_at"]
        read_only_fields = ["id", "created_at"]


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ["id", "subject", "section_code", "capacity", "schedule", "created_at"]  # ← schedule added
        read_only_fields = ["id", "created_at"]


class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ["id", "student", "subject", "section", "created_at"]
        read_only_fields = ["id", "section", "created_at"]

    def validate(self, attrs):
        student = attrs.get("student")
        subject = attrs.get("subject")
        if Enrollment.objects.filter(student=student, subject=subject).exists():
            raise serializers.ValidationError("Student is already enrolled in this subject.")
        if not Section.objects.filter(subject=subject).exists():
            raise serializers.ValidationError("No sections available for this subject.")
        return attrs

    def create(self, validated_data):
        from django.db import transaction
        from django.db.models import Count

        student = validated_data["student"]
        subject = validated_data["subject"]

        with transaction.atomic():
            if Enrollment.objects.filter(student=student, subject=subject).exists():
                raise serializers.ValidationError("Student is already enrolled in this subject.")

            section_qs = (
                Section.objects.select_for_update()
                .filter(subject=subject)
                .annotate(current_enrollment=Count("enrollments"))
                .order_by("current_enrollment", "id")
            )

            chosen_section = None
            for sec in section_qs:
                if sec.current_enrollment < sec.capacity:
                    chosen_section = sec
                    break

            if not chosen_section:
                raise serializers.ValidationError("No section capacity available for this subject.")

            return Enrollment.objects.create(
                student=student,
                subject=subject,
                section=chosen_section,
            )

