from django.db import models


class Clinic(models.Model):
    name = models.CharField(max_length=255)
    code = models.SlugField(unique=True)
    owner = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="owned_clinics",
        null=True,
        blank=True,
    )
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=32, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=128, blank=True)
    country = models.CharField(max_length=128, blank=True)
    timezone = models.CharField(max_length=64, default="UTC")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["code", "is_active"]),
            models.Index(fields=["owner", "created_at"]),
        ]
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
