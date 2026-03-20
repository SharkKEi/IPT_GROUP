from django.core.exceptions import ValidationError
from django.db import models


class Student(models.Model):
    """
    Represents a student that can enroll in multiple subjects.
    """

    student_number = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.full_name} ({self.student_number})"


class Subject(models.Model):
    """
    Represents a subject/course with a number of academic units.
    """

    subject_code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)
    units = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.subject_code} - {self.title}"


class Section(models.Model):
    """
    Represents a capacity-limited section for a given subject.
    """

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="sections")
    section_code = models.CharField(max_length=10)
    capacity = models.PositiveIntegerField()
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
    """
    Enrollment of one student in one subject, automatically assigned to a section.
    """

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="enrollments")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="enrollments")
    section = models.ForeignKey(Section, on_delete=models.PROTECT, related_name="enrollments")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            # Prevent duplicate enrollment of the same student into the same subject.
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
        # Ensure capacity rules are enforced even when creating enrollments outside the API.
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.student.full_name} -> {self.subject.subject_code} ({self.section.section_code})"
