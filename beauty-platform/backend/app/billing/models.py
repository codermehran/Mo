from django.db import models
from django.utils import timezone


class Plan(models.Model):
    class Tier(models.TextChoices):
        BASIC = "BASIC", "Basic"
        STANDARD = "STANDARD", "Standard"
        PREMIUM = "PREMIUM", "Premium"

    name = models.CharField(max_length=100, unique=True)
    tier = models.CharField(
        max_length=20,
        choices=Tier.choices,
        default=Tier.BASIC,
    )
    monthly_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    max_staff = models.PositiveIntegerField(default=5)
    max_patients = models.PositiveIntegerField(default=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["monthly_price"]

    def __str__(self) -> str:
        return self.name


class Subscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        TRIAL = "TRIAL", "Trial"
        CANCELLED = "CANCELLED", "Cancelled"
        EXPIRED = "EXPIRED", "Expired"

    clinic = models.OneToOneField(
        "clinics.Clinic",
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="subscriptions")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TRIAL,
        db_index=True,
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    auto_renew = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "start_date"]),
            models.Index(fields=["plan", "clinic"]),
        ]
        ordering = ["-start_date"]

    def __str__(self) -> str:
        return f"{self.clinic} - {self.plan}"


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    appointment = models.ForeignKey(
        "appointments.Appointment",
        on_delete=models.CASCADE,
        related_name="payments",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=8, default="USD")
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    method = models.CharField(max_length=32, blank=True)
    transaction_id = models.CharField(max_length=128, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["appointment", "status"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Payment {self.amount} {self.currency} ({self.status})"


class BillingPayment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    clinic = models.ForeignKey(
        "clinics.Clinic",
        on_delete=models.CASCADE,
        related_name="billing_payments",
    )
    plan = models.ForeignKey(
        Plan, on_delete=models.PROTECT, related_name="billing_payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=8, default="USD")
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    invoice_id = models.CharField(max_length=128, blank=True)
    reference_id = models.CharField(max_length=128, unique=True)
    checkout_url = models.URLField(blank=True)
    transaction_id = models.CharField(max_length=128, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["clinic", "status"]),
            models.Index(fields=["reference_id"], name="billing_pay_ref_id_idx"),
        ]
        ordering = ["-created_at"]

    def mark_success(
        self,
        transaction_id: str | None = None,
        invoice_id: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        self.status = self.Status.SUCCESS
        if transaction_id:
            self.transaction_id = transaction_id
        if invoice_id:
            self.invoice_id = invoice_id
        if metadata is not None:
            existing = self.metadata or {}
            if isinstance(existing, dict) and isinstance(metadata, dict):
                existing.update(metadata)
                self.metadata = existing
            else:
                self.metadata = metadata
        self.paid_at = timezone.now()
        self.save(
            update_fields=[
                "status",
                "transaction_id",
                "invoice_id",
                "metadata",
                "paid_at",
                "updated_at",
            ]
        )
