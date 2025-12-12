from django.contrib.auth import get_user_model
from rest_framework import serializers

from patients.models import Patient

User = get_user_model()


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            "id",
            "clinic",
            "user",
            "first_name",
            "last_name",
            "phone_number",
            "email",
            "date_of_birth",
            "gender",
            "notes",
        ]
        read_only_fields = ["id", "clinic", "user"]

    def validate_user(self, value: User | None) -> User | None:
        if value and value.clinic_id != self.context.get("request").user.clinic_id:
            raise serializers.ValidationError("User must belong to the clinic.")
        return value
