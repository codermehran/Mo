from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        CLINIC_OWNER = "CLINIC_OWNER", "Clinic Owner"
        PRACTITIONER = "PRACTITIONER", "Practitioner"
        STAFF = "STAFF", "Staff"
        PATIENT = "PATIENT", "Patient"

    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=32, blank=True)
    role = models.CharField(
        max_length=32,
        choices=Role.choices,
        default=Role.STAFF,
        db_index=True,
    )
    clinic = models.ForeignKey(
        "clinics.Clinic",
        on_delete=models.SET_NULL,
        related_name="users",
        null=True,
        blank=True,
    )

    REQUIRED_FIELDS = ["email"]

    class Meta:
        indexes = [
            models.Index(fields=["role", "clinic"]),
            models.Index(fields=["username", "email"]),
        ]


class OTPRequest(models.Model):
    class Purpose(models.TextChoices):
        LOGIN = "LOGIN", "Login"
        RECOVERY = "RECOVERY", "Recovery"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="otp_requests",
        null=True,
        blank=True,
    )
    phone_number = models.CharField(max_length=32, db_index=True)
    purpose = models.CharField(max_length=16, choices=Purpose.choices, db_index=True)
    code_hash = models.CharField(max_length=128)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    sent_count = models.PositiveIntegerField(default=1)
    attempt_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["phone_number", "created_at"]),
            models.Index(fields=["phone_number", "purpose", "created_at"]),
            models.Index(fields=["user", "is_verified"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"OTP for {self.phone_number} ({'verified' if self.is_verified else 'pending'})"
