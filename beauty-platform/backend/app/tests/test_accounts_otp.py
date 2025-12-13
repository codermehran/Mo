import secrets

import pytest
from django.utils import timezone
from rest_framework import status

from accounts.models import OTPRequest
from accounts.views import OTP_RATE_LIMIT

pytestmark = pytest.mark.django_db


def test_request_and_verify_otp_happy_path(api_client, user_factory, monkeypatch):
    user = user_factory(phone_number="09123456789")

    monkeypatch.setattr("accounts.views._send_kavenegar_otp", lambda *args, **kwargs: None)
    monkeypatch.setattr(secrets, "randbelow", lambda _: 123456)

    request_payload = {"phone_number": user.phone_number, "purpose": OTPRequest.Purpose.LOGIN}
    response = api_client.post("/api/auth/request-otp", request_payload, format="json")

    assert response.status_code == status.HTTP_200_OK
    otp = OTPRequest.objects.get(phone_number=user.phone_number, purpose=OTPRequest.Purpose.LOGIN)
    assert otp.sent_count == 1
    assert otp.expires_at > timezone.now()

    verify_payload = {
        "phone_number": user.phone_number,
        "purpose": OTPRequest.Purpose.LOGIN,
        "code": "123456",
    }
    verify_response = api_client.post("/api/auth/verify-otp", verify_payload, format="json")

    assert verify_response.status_code == status.HTTP_200_OK
    otp.refresh_from_db()
    assert otp.is_verified is True
    assert verify_response.data["user_id"] == user.id


def test_request_otp_rate_limit(api_client, user_factory, monkeypatch):
    user = user_factory(phone_number="09876543210")

    monkeypatch.setattr("accounts.views._send_kavenegar_otp", lambda *args, **kwargs: None)
    monkeypatch.setattr(secrets, "randbelow", lambda _: 654321)

    payload = {"phone_number": user.phone_number, "purpose": OTPRequest.Purpose.LOGIN}
    for _ in range(OTP_RATE_LIMIT):
        success_response = api_client.post("/api/auth/request-otp", payload, format="json")
        assert success_response.status_code == status.HTTP_200_OK

    blocked_response = api_client.post("/api/auth/request-otp", payload, format="json")

    assert blocked_response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert blocked_response.data["detail"] == "Rate limit exceeded for OTP requests."
