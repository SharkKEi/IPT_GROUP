from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.validators import validate_email
from rest_framework import serializers

from .models import Enrollment, Section, Student, Subject, UserProfile


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username_or_email = attrs.get("username", "").strip()
        password = attrs.get("password", "")

        if not username_or_email or not password:
            raise serializers.ValidationError("Must include username/email and password.")

        candidate = (
            User.objects.filter(email__iexact=username_or_email).first()
            if "@" in username_or_email
            else User.objects.filter(username__iexact=username_or_email).first()
        )

        if candidate and not candidate.is_active:
            raise serializers.ValidationError("Account is not activated. Please check your email.")

        username = candidate.username if candidate else username_or_email
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials.")

        if hasattr(user, "profile") and not user.profile.is_email_verified:
            raise serializers.ValidationError("Account is not activated. Please check your email.")

        attrs["user"] = user
        return attrs


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    confirm_password = serializers.CharField(min_length=6, write_only=True)
    profile_picture = serializers.ImageField(required=False, allow_empty_file=False)

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        validate_email(value)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate_profile_picture(self, value):
        if not value:
            return value

        max_size_mb = 2
        if value.size > max_size_mb * 1024 * 1024:
            raise serializers.ValidationError(f"Image must be {max_size_mb}MB or smaller.")

        allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
        content_type = getattr(value, "content_type", "")
        if content_type and content_type not in allowed_types:
            raise serializers.ValidationError("Only JPG, PNG, WEBP, or GIF images are allowed.")

        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        picture = validated_data.pop("profile_picture", None)
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=password,
            is_active=False,
        )

        profile, _ = UserProfile.objects.get_or_create(user=user)
        if picture:
            profile.profile_picture = picture
            profile.save(update_fields=["profile_picture"])

        profile.generate_activation_token()
        return user


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

    def validate_units(self, value):
        if value < 1:
            raise serializers.ValidationError("Units must be at least 1.")
        return value


class SectionSerializer(serializers.ModelSerializer):
    subject_code = serializers.CharField(source="subject.subject_code", read_only=True)
    subject_title = serializers.CharField(source="subject.title", read_only=True)
    current_enrollment = serializers.IntegerField(read_only=True)
    remaining_slots = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = [
            "id",
            "subject",
            "subject_code",
            "subject_title",
            "section_code",
            "capacity",
            "schedule",
            "current_enrollment",
            "remaining_slots",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "current_enrollment", "remaining_slots"]

    def get_remaining_slots(self, obj):
        current = getattr(obj, "current_enrollment", obj.enrollments.count())
        return max(obj.capacity - current, 0)

    def validate_capacity(self, value):
        if value < 1:
            raise serializers.ValidationError("Capacity must be at least 1.")
        return value

    def validate_section_code(self, value):
        return value.strip().upper()


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    student_number = serializers.CharField(source="student.student_number", read_only=True)
    subject_code = serializers.CharField(source="subject.subject_code", read_only=True)
    subject_title = serializers.CharField(source="subject.title", read_only=True)
    section_code = serializers.CharField(source="section.section_code", read_only=True)
    schedule = serializers.CharField(source="section.schedule", read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "student",
            "student_name",
            "student_number",
            "subject",
            "subject_code",
            "subject_title",
            "section",
            "section_code",
            "schedule",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "section",
            "student_name",
            "student_number",
            "subject_code",
            "subject_title",
            "section_code",
            "schedule",
            "created_at",
        ]

    def validate(self, attrs):
        student = attrs.get("student")
        subject = attrs.get("subject")

        if Enrollment.objects.filter(student=student, subject=subject).exists():
            raise serializers.ValidationError("Student is already enrolled in this subject. This enrollment must be unique.")

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
                raise serializers.ValidationError("Student is already enrolled in this subject. This enrollment must be unique.")

            section_qs = (
                Section.objects.select_for_update()
                .filter(subject=subject)
                .annotate(current_enrollment=Count("enrollments"))
                .order_by("current_enrollment", "id")
            )

            chosen_section = next(
                (section for section in section_qs if section.current_enrollment < section.capacity),
                None,
            )

            if not chosen_section:
                raise serializers.ValidationError("No section capacity available for this subject.")

            return Enrollment.objects.create(
                student=student,
                subject=subject,
                section=chosen_section,
            )
