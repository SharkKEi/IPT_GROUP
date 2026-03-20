from rest_framework import serializers
from django.contrib.auth import authenticate

from .models import Enrollment, Section, Student, Subject

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
            else:
                attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password.')

        return attrs


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
        fields = ["id", "subject", "section_code", "capacity", "created_at"]
        read_only_fields = ["id", "created_at"]


class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Creates enrollments while enforcing:
    - no duplicate enrollment per (student, subject)
    - section capacity limits
    - automatic section assignment (based on the least-filled available section)
    """

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
            # Re-check duplicates inside the transaction.
            if Enrollment.objects.filter(student=student, subject=subject).exists():
                raise serializers.ValidationError("Student is already enrolled in this subject.")

            # Lock candidate sections to prevent concurrent over-enrollment.
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
