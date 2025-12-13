import secrets
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status

from accounts.models import OTPRequest, User
from accounts.views import (
    OTP_IP_VERIFY_LIMIT,
    OTP_MAX_ATTEMPTS,
    OTP_RATE_LIMIT,
    _hash_code,
)

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


def test_request_otp_rate_limit_by_ip(
    api_client, user_factory, monkeypatch, settings
):
    settings.CACHES["default"]["LOCATION"] = "unique-otp-cache"
    users = [user_factory(phone_number=f"0911111111{i}") for i in range(OTP_RATE_LIMIT)]

    monkeypatch.setattr("accounts.views._send_kavenegar_otp", lambda *args, **kwargs: None)
    monkeypatch.setattr(secrets, "randbelow", lambda _: 654321)

    payloads = [
        {"phone_number": user.phone_number, "purpose": OTPRequest.Purpose.LOGIN}
        for user in users
    ]

    for payload in payloads:
        response = api_client.post(
            "/api/auth/request-otp",
            payload,
            format="json",
            REMOTE_ADDR="10.0.0.1",
        )
        assert response.status_code == status.HTTP_200_OK

    blocked = api_client.post(
        "/api/auth/request-otp",
        payloads[-1],
        format="json",
        REMOTE_ADDR="10.0.0.1",
    )

    assert blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert blocked.data["detail"] == "Rate limit exceeded for OTP requests."


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


def test_verify_otp_wrong_code(api_client, user_factory):
    user = user_factory(phone_number="09127770000")
    otp = OTPRequest.objects.create(
        user=user,
        phone_number=user.phone_number,
        purpose=OTPRequest.Purpose.LOGIN,
        code_hash=_hash_code("555555", user.phone_number),
        expires_at=timezone.now() + timedelta(minutes=2),
    )

    response = api_client.post(
        "/api/auth/verify-otp",
        {
            "phone_number": user.phone_number,
            "purpose": OTPRequest.Purpose.LOGIN,
            "code": "123456",
        },
        format="json",
    )

    otp.refresh_from_db()
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "Invalid OTP code."
    assert otp.attempt_count == 1


def test_verify_otp_expired(api_client, user_factory):
    user = user_factory(phone_number="09127770001")
    otp = OTPRequest.objects.create(
        user=user,
        phone_number=user.phone_number,
        purpose=OTPRequest.Purpose.LOGIN,
        code_hash=_hash_code("123456", user.phone_number),
        expires_at=timezone.now() - timedelta(seconds=1),
    )

    response = api_client.post(
        "/api/auth/verify-otp",
        {
            "phone_number": user.phone_number,
            "purpose": OTPRequest.Purpose.LOGIN,
            "code": "123456",
        },
        format="json",
    )

    otp.refresh_from_db()
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "OTP code has expired."
    assert otp.attempt_count == 1


def test_verify_otp_attempt_limit(api_client, user_factory):
    user = user_factory(phone_number="09127770002")
    otp = OTPRequest.objects.create(
        user=user,
        phone_number=user.phone_number,
        purpose=OTPRequest.Purpose.LOGIN,
        code_hash=_hash_code("123456", user.phone_number),
        expires_at=timezone.now() + timedelta(minutes=2),
        attempt_count=OTP_MAX_ATTEMPTS,
    )

    response = api_client.post(
        "/api/auth/verify-otp",
        {
            "phone_number": user.phone_number,
            "purpose": OTPRequest.Purpose.LOGIN,
            "code": "123456",
        },
        format="json",
    )

    otp.refresh_from_db()
    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert response.data["detail"] == "Too many verification attempts."
    assert otp.attempt_count == OTP_MAX_ATTEMPTS + 1


def test_verify_otp_ip_rate_limit(api_client, user_factory, monkeypatch):
    user = user_factory(phone_number="09127770003")
    otp = OTPRequest.objects.create(
        user=user,
        phone_number=user.phone_number,
        purpose=OTPRequest.Purpose.LOGIN,
        code_hash=_hash_code("123456", user.phone_number),
        expires_at=timezone.now() + timedelta(minutes=2),
    )
    monkeypatch.setattr("accounts.views.OTP_MAX_ATTEMPTS", OTP_MAX_ATTEMPTS * 5)

    for _ in range(OTP_IP_VERIFY_LIMIT):
        api_client.post(
            "/api/auth/verify-otp",
            {
                "phone_number": user.phone_number,
                "purpose": OTPRequest.Purpose.LOGIN,
                "code": "000000",
            },
            format="json",
            REMOTE_ADDR="192.168.1.10",
        )

    blocked = api_client.post(
        "/api/auth/verify-otp",
        {
            "phone_number": user.phone_number,
            "purpose": OTPRequest.Purpose.LOGIN,
            "code": "000000",
        },
        format="json",
        REMOTE_ADDR="192.168.1.10",
    )

    otp.refresh_from_db()
    assert blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert blocked.data["detail"] == "Too many verification attempts from this IP."
    assert otp.attempt_count == OTP_IP_VERIFY_LIMIT


def test_verify_otp_returns_clinic_link(api_client, clinic_factory, user_factory):
    clinic = clinic_factory()
    user = user_factory(phone_number="09127770004", clinic=clinic, role=User.Role.CLINIC_OWNER)
    otp = OTPRequest.objects.create(
        user=user,
        phone_number=user.phone_number,
        purpose=OTPRequest.Purpose.LOGIN,
        code_hash=_hash_code("999999", user.phone_number),
        expires_at=timezone.now() + timedelta(minutes=2),
    )

    response = api_client.post(
        "/api/auth/verify-otp",
        {
            "phone_number": user.phone_number,
            "purpose": OTPRequest.Purpose.LOGIN,
            "code": "999999",
        },
        format="json",
    )

    otp.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert response.data["user_id"] == user.id
    assert response.data["clinic_id"] == clinic.id
    assert response.data["requires_setup"] is False
