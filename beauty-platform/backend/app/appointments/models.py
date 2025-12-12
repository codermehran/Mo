from django.db import models


class Appointment(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        CONFIRMED = "CONFIRMED", "Confirmed"
        CHECKED_IN = "CHECKED_IN", "Checked in"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        NO_SHOW = "NO_SHOW", "No show"

    clinic = models.ForeignKey(
        "clinics.Clinic",
        on_delete=models.CASCADE,
        related_name="appointments",
    )
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="appointments",
    )
    service = models.ForeignKey(
        "services.Service",
        on_delete=models.SET_NULL,
        related_name="appointments",
        null=True,
        blank=True,
    )
    provider = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="appointments",
        null=True,
        blank=True,
    )
    scheduled_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=30)
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.SCHEDULED,
        db_index=True,
    )
    notes = models.TextField(blank=True)
    reference_id = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["clinic", "scheduled_time"]),
            models.Index(fields=["patient", "status"]),
            models.Index(fields=["provider", "scheduled_time"]),
        ]
        ordering = ["-scheduled_time"]

    def __str__(self) -> str:
        return f"Appointment #{self.id}"


class Procedure(models.Model):
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name="procedures",
    )
    service = models.ForeignKey(
        "services.Service",
        on_delete=models.SET_NULL,
        related_name="procedures",
        null=True,
        blank=True,
    )
    description = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    performed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="procedures",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["appointment", "created_at"]),
            models.Index(fields=["service", "performed_by"]),
        ]
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Procedure for appointment {self.appointment_id}"
