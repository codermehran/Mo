import pytest
from rest_framework import status

from billing.models import BillingPayment, Plan, Subscription
from billing.serializers import activate_subscription

pytestmark = pytest.mark.django_db


class _FakeResponse:
    status_code = 200

    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


def test_bitpay_webhook_activates_plan(api_client, clinic_factory, settings, monkeypatch):
    settings.BITPAY_API_KEY = "test-key"
    settings.BITPAY_VERIFY_URL = "https://example.com/verify"
    clinic = clinic_factory()
    plan = Plan.objects.create(name="Pro", tier=Plan.Tier.STANDARD, monthly_price=200)
    payment = BillingPayment.objects.create(
        clinic=clinic,
        plan=plan,
        amount=plan.monthly_price,
        currency="USD",
        status=BillingPayment.Status.PENDING,
        reference_id="ref-123",
    )

    payload = {"status": 1, "factorId": payment.reference_id}
    monkeypatch.setattr(
        "requests.post",
        lambda url, data=None, timeout=None: _FakeResponse(payload),
    )

    response = api_client.post(
        "/api/billing/webhook/bitpay",
        {"trans_id": "txn-1", "id_get": "invoice-1", "factorId": payment.reference_id},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK

    payment.refresh_from_db()
    assert payment.status == BillingPayment.Status.SUCCESS
    subscription = clinic.subscription
    assert subscription.plan_id == plan.id
    assert subscription.status == Subscription.Status.ACTIVE


def test_bitpay_webhook_missing_params_returns_400(api_client, settings):
    settings.BITPAY_API_KEY = "test-key"
    response = api_client.post("/api/billing/webhook/bitpay", {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "missing_parameters"


def test_bitpay_webhook_marks_failed_without_activation(
    api_client, clinic_factory, plan_factory, billing_payment_factory, settings, monkeypatch
):
    settings.BITPAY_API_KEY = "test-key"
    clinic = clinic_factory()
    plan = plan_factory()
    payment = billing_payment_factory(clinic=clinic, plan=plan)

    payload = {"status": 0, "factorId": payment.reference_id}
    monkeypatch.setattr(
        "requests.post", lambda url, data=None, timeout=None: _FakeResponse(payload)
    )
    activate_called = False

    def _fake_activate(*args, **kwargs):
        nonlocal activate_called
        activate_called = True

    monkeypatch.setattr("billing.views.activate_subscription", _fake_activate)

    response = api_client.post(
        "/api/billing/webhook/bitpay",
        {"trans_id": "txn-2", "id_get": "invoice-2", "factorId": payment.reference_id},
        format="json",
    )

    payment.refresh_from_db()
    assert response.status_code == status.HTTP_202_ACCEPTED
    assert payment.status == BillingPayment.Status.FAILED
    assert activate_called is False


def test_bitpay_webhook_rejects_mismatched_reference(
    api_client, clinic_factory, plan_factory, billing_payment_factory, settings, monkeypatch
):
    settings.BITPAY_API_KEY = "test-key"
    clinic = clinic_factory()
    plan = plan_factory()
    payment = billing_payment_factory(clinic=clinic, plan=plan)

    payload = {"status": 1, "factorId": "other-ref"}
    monkeypatch.setattr(
        "requests.post", lambda url, data=None, timeout=None: _FakeResponse(payload)
    )

    response = api_client.post(
        "/api/billing/webhook/bitpay",
        {"trans_id": "txn-3", "id_get": "invoice-3", "factorId": payment.reference_id},
        format="json",
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.data["detail"] == "payment_not_found"


def test_bitpay_webhook_is_idempotent(api_client, clinic_factory, settings, monkeypatch):
    settings.BITPAY_API_KEY = "test-key"
    clinic = clinic_factory()
    plan = Plan.objects.create(name="Pro", tier=Plan.Tier.STANDARD, monthly_price=200)
    payment = BillingPayment.objects.create(
        clinic=clinic,
        plan=plan,
        amount=plan.monthly_price,
        currency="USD",
        status=BillingPayment.Status.PENDING,
        reference_id="ref-456",
    )

    payload = {"status": 1, "factorId": payment.reference_id}
    monkeypatch.setattr(
        "requests.post", lambda url, data=None, timeout=None: _FakeResponse(payload)
    )
    activate_count = 0

    def _fake_activate(clinic_arg, plan_arg):
        nonlocal activate_count
        activate_count += 1
        return activate_subscription(clinic_arg, plan_arg)

    monkeypatch.setattr("billing.views.activate_subscription", _fake_activate)

    first_response = api_client.post(
        "/api/billing/webhook/bitpay",
        {"trans_id": "txn-4", "id_get": "invoice-4", "factorId": payment.reference_id},
        format="json",
    )
    second_response = api_client.post(
        "/api/billing/webhook/bitpay",
        {"trans_id": "txn-4", "id_get": "invoice-4", "factorId": payment.reference_id},
        format="json",
    )

    assert first_response.status_code == status.HTTP_200_OK
    assert second_response.status_code == status.HTTP_200_OK
    assert second_response.data["detail"] == "already_processed"
    assert activate_count == 1
