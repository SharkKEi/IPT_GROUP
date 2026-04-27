from django.core.exceptions import ValidationError
from django.db import models
from django.contrib.auth.models import User
import secrets


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    activation_token = models.CharField(max_length=64, blank=True, null=True)

    def generate_activation_token(self):
        self.activation_token = secrets.token_urlsafe(32)
        self.save(update_fields=['activation_token'])
        return self.activation_token

    def __str__(self):
        return f"Profile of {self.user.username}"


class Student(models.Model):
    student_number = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.full_name} ({self.student_number})"


class Subject(models.Model):
    subject_code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)
    units = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.subject_code} - {self.title}"


class Section(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="sections")
    section_code = models.CharField(max_length=10)
    capacity = models.PositiveIntegerField()
    schedule = models.CharField(max_length=100, blank=True, default='')  # ← NEW
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["subject", "section_code"], name="unique_section_per_subject")
        ]

    def __str__(self) -> str:
        return f"{self.subject.subject_code} - {self.section_code}"

    def clean(self):
        if self.capacity < 1:
            raise ValidationError({"capacity": "Capacity must be at least 1."})


class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="enrollments")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="enrollments")
    section = models.ForeignKey(Section, on_delete=models.PROTECT, related_name="enrollments")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "subject"], name="unique_student_subject_enrollment")
        ]

    def clean(self):
        if self.section_id and self.subject_id and self.section.subject_id != self.subject_id:
            raise ValidationError({"section": "Section must belong to the selected subject."})

        if self.section_id:
            current_enrollments = (
                Enrollment.objects.filter(section_id=self.section_id)
                .exclude(pk=self.pk)
                .count()
            )
            if current_enrollments >= self.section.capacity:
                raise ValidationError({"section": "Selected section is already full."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.student.full_name} -> {self.subject.subject_code} ({self.section.section_code})"

