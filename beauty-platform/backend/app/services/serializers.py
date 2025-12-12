from rest_framework import serializers

from services.models import Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "clinic",
            "name",
            "description",
            "duration_minutes",
            "base_price",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "clinic", "created_at", "updated_at"]
