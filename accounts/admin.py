from django.contrib import admin
from .models import Enrollment, Section, Student, Subject


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
    list_display = ("subject", "section_code", "capacity", "created_at")
    list_filter = ("subject",)
    search_fields = ("section_code", "subject__subject_code")


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "subject", "section", "created_at")
    list_filter = ("subject", "section")
    search_fields = ("student__student_number", "student__full_name", "subject__subject_code", "section__section_code")
