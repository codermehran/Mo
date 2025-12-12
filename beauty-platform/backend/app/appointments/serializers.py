from django.contrib.auth import get_user_model
from rest_framework import serializers

from appointments.models import Appointment, Procedure
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
        if value.role not in (User.Role.PRACTITIONER, User.Role.STAFF):
            raise serializers.ValidationError(
                "Provider must have role PRACTITIONER or STAFF."
            )
        return value

    def validate_service(self, value: Service | None) -> Service | None:
        if value is None:
            return value
        clinic_id = self.context.get("request").user.clinic_id
        if value.clinic_id != clinic_id:
            raise serializers.ValidationError("Service must belong to the clinic.")
        return value


class ProcedureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Procedure
        fields = [
            "id",
            "appointment",
            "service",
            "description",
            "price",
            "performed_by",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_appointment(self, value: Appointment) -> Appointment:
        clinic_id = self.context.get("request").user.clinic_id
        if value.clinic_id != clinic_id:
            raise serializers.ValidationError("Appointment must belong to the clinic.")
        return value

    def validate_service(self, value: Service | None) -> Service | None:
        if value is None:
            return value
        clinic_id = self.context.get("request").user.clinic_id
        if value.clinic_id != clinic_id:
            raise serializers.ValidationError("Service must belong to the clinic.")
        return value

    def validate_performed_by(self, value: User | None) -> User | None:
        if value is None:
            return value
        clinic_id = self.context.get("request").user.clinic_id
        if value.clinic_id != clinic_id:
            raise serializers.ValidationError("User must belong to the clinic.")
        return value

