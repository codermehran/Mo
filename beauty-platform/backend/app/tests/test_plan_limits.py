import pytest
from rest_framework import status

from accounts.models import User
from billing.limits import PlanLimitExceeded
from billing.models import Plan

pytestmark = pytest.mark.django_db


class _FakeResponse:
    status_code = 200

    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


def _activate_paid_plan(api_client, payment, monkeypatch, settings):
    settings.BITPAY_API_KEY = "test-key"
    payload = {"status": 1, "factorId": payment.reference_id}
    monkeypatch.setattr(
        "requests.post", lambda url, data=None, timeout=None: _FakeResponse(payload)
    )
    return api_client.post(
        "/api/billing/webhook/bitpay",
        {"trans_id": "txn-paid", "id_get": "invoice-paid", "factorId": payment.reference_id},
        format="json",
    )


def test_plan_limits_block_on_free_tier_until_payment(
    api_client,
    clinic_factory,
    patient_factory,
    service_factory,
    appointment_factory,
    user_factory,
    billing_payment_factory,
    plan_factory,
    settings,
    monkeypatch,
):
    settings.FREE_MAX_STAFF = 1
    settings.FREE_MAX_PATIENTS = 1
    settings.FREE_MAX_APPOINTMENTS = 1

    clinic = clinic_factory()
    owner = user_factory(clinic=clinic, role=User.Role.CLINIC_OWNER)
    user_factory(clinic=clinic, role=User.Role.STAFF)
    patient = patient_factory(clinic=clinic)
    service = service_factory(clinic=clinic)
    appointment_factory(clinic=clinic, patient=patient, service=service)
    api_client.force_authenticate(user=owner)

    patient_payload = {
        "first_name": "Extra",
        "last_name": "Patient",
        "phone_number": "09129999999",
    }
    staff_payload = {
        "username": "newstaff",
        "email": "newstaff@example.com",
        "phone_number": "09123334444",
    }
    appointment_payload = {
        "patient": patient.id,
        "service": service.id,
        "scheduled_time": patient.created_at.isoformat(),
        "duration_minutes": 45,
    }

    patient_response = api_client.post("/api/patients/", patient_payload, format="json")
    staff_response = api_client.post("/api/staff/", staff_payload, format="json")
    appointment_response = api_client.post(
        "/api/appointments/", appointment_payload, format="json"
    )

    for response in (patient_response, staff_response, appointment_response):
        assert response.status_code == status.HTTP_402_PAYMENT_REQUIRED
        assert response.data["detail"] == PlanLimitExceeded.default_detail

    paid_plan = plan_factory(tier=Plan.Tier.STANDARD, monthly_price=250)
    payment = billing_payment_factory(clinic=clinic, plan=paid_plan)

    webhook_response = _activate_paid_plan(api_client, payment, monkeypatch, settings)
    assert webhook_response.status_code == status.HTTP_200_OK

    post_payment_patient = api_client.post(
        "/api/patients/", patient_payload, format="json"
    )
    post_payment_staff = api_client.post("/api/staff/", staff_payload, format="json")
    post_payment_appointment = api_client.post(
        "/api/appointments/", appointment_payload, format="json"
    )

    assert post_payment_patient.status_code == status.HTTP_201_CREATED
    assert post_payment_staff.status_code == status.HTTP_201_CREATED
    assert post_payment_appointment.status_code == status.HTTP_201_CREATED
