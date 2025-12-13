import pytest
from rest_framework import status

from billing.models import BillingPayment, Plan, Subscription

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
