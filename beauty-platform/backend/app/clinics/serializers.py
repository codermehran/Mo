from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Clinic

User = get_user_model()


class ClinicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinic
        fields = [
            "id",
            "name",
            "code",
            "email",
            "phone_number",
            "address",
            "city",
            "country",
            "timezone",
            "is_active",
            "owner",
        ]
        read_only_fields = ["id", "owner", "is_active"]


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "role",
            "clinic",
        ]
        read_only_fields = ["id", "clinic"]
