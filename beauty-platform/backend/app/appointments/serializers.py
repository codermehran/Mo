from django.contrib.auth import get_user_model
from rest_framework import serializers

from appointments.models import Appointment
from patients.models import Patient
from services.models import Service

User = get_user_model()


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            "id",
            "clinic",
            "patient",
            "service",
            "provider",
            "scheduled_time",
            "duration_minutes",
            "status",
            "notes",
            "reference_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "clinic", "created_at", "updated_at"]

    def validate_patient(self, value: Patient) -> Patient:
        clinic_id = self.context.get("request").user.clinic_id
        if value.clinic_id != clinic_id:
            raise serializers.ValidationError("Patient must belong to the clinic.")
        return value

    def validate_provider(self, value: User | None) -> User | None:
        if value is None:
            return value
        clinic_id = self.context.get("request").user.clinic_id
        if value.clinic_id != clinic_id:
            raise serializers.ValidationError("Provider must belong to the clinic.")
        return value

    def validate_service(self, value: Service) -> Service:
        clinic_id = self.context.get("request").user.clinic_id
        if value.clinic_id != clinic_id:
            raise serializers.ValidationError("Service must belong to the clinic.")
        return value
