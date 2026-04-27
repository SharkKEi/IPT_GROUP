from django.contrib import admin
from django.db.models import Count

from .models import Enrollment, Section, Student, Subject, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "is_email_verified", "has_profile_picture")
    list_filter = ("is_email_verified",)
    search_fields = ("user__username", "user__email")

    def has_profile_picture(self, obj):
        return bool(obj.profile_picture)

    has_profile_picture.boolean = True


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("student_number", "full_name", "created_at")
    search_fields = ("student_number", "full_name")


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("subject_code", "title", "units", "created_at")
    search_fields = ("subject_code", "title")


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ("subject", "section_code", "schedule", "capacity", "current_enrollment", "remaining_slots", "created_at")
    list_filter = ("subject",)
    search_fields = ("section_code", "subject__subject_code", "subject__title")

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("subject").annotate(enrollment_count=Count("enrollments"))

    def current_enrollment(self, obj):
        return obj.enrollment_count

    def remaining_slots(self, obj):
        return max(obj.capacity - obj.enrollment_count, 0)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "subject", "section", "created_at")
    list_filter = ("subject", "section")
    search_fields = ("student__student_number", "student__full_name", "subject__subject_code", "section__section_code")
