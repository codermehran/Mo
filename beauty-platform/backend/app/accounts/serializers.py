from django.utils import timezone
from rest_framework import serializers

from .models import OTPRequest


class RequestOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=32)
    purpose = serializers.ChoiceField(choices=OTPRequest.Purpose.choices)

    def validate_phone_number(self, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("Phone number is required.")
        return normalized


class VerifyOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=32)
    code = serializers.CharField(min_length=6, max_length=6)
    purpose = serializers.ChoiceField(choices=OTPRequest.Purpose.choices)

    def validate(self, attrs):
        attrs["phone_number"] = attrs.get("phone_number", "").strip()
        if not attrs["phone_number"]:
            raise serializers.ValidationError({"phone_number": "Phone number is required."})
        return attrs

    @staticmethod
    def is_expired(otp: OTPRequest) -> bool:
        return otp.expires_at <= timezone.now()
