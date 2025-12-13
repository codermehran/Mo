import uuid
from datetime import timedelta

import requests
from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from .models import BillingPayment, Plan, Subscription


class CreateCheckoutSerializer(serializers.Serializer):
    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects.all(), source="plan", required=True
    )
    currency = serializers.CharField(max_length=8, default="USD")

    def create(self, validated_data):
        clinic = self.context["clinic"]
        plan: Plan = validated_data["plan"]
        currency = validated_data.get("currency", "USD")

        reference_id = uuid.uuid4().hex
        api_key = getattr(settings, "BITPAY_API_KEY", None)
        redirect_url = getattr(settings, "BITPAY_REDIRECT_URL", None)
        request_url = getattr(
            settings, "BITPAY_REQUEST_URL", "https://bitpay.ir/payment/gateway-send"
        )
        checkout_prefix = getattr(
            settings, "BITPAY_CHECKOUT_URL", "https://bitpay.ir/payment/gateway-"
        )
        if not api_key or not redirect_url:
            raise serializers.ValidationError(
                {"non_field_errors": ["BitPay.ir API key or redirect URL is not set."]}
            )

        payload = {
            "api": api_key,
            "redirect": redirect_url,
            "amount": int(plan.monthly_price),
            "factorId": reference_id,
            "name": clinic.name or clinic.code,
            "email": clinic.email or getattr(clinic.owner, "email", ""),
            "description": f"Subscription for {plan.name}",
        }

        try:
            response = requests.post(request_url, data=payload, timeout=10)
        except requests.RequestException as exc:  # pragma: no cover - external call
            raise serializers.ValidationError(
                {"non_field_errors": ["Failed to reach BitPay.ir gateway."]}
            ) from exc

        if response.status_code != 200:
            raise serializers.ValidationError(
                {"non_field_errors": ["BitPay.ir gateway returned an error."]}
            )

        invoice_id = response.text.strip()
        try:
            invoice_numeric = int(invoice_id)
        except ValueError:
            invoice_numeric = -1
        if invoice_numeric <= 0:
            raise serializers.ValidationError(
                {"non_field_errors": ["Invalid BitPay.ir invoice identifier returned."]}
            )

        checkout_url = f"{checkout_prefix}{invoice_id}"

        payment = BillingPayment.objects.create(
            clinic=clinic,
            plan=plan,
            amount=plan.monthly_price,
            currency=currency,
            reference_id=reference_id,
            invoice_id=invoice_id,
            checkout_url=checkout_url,
            metadata={"request_payload": payload},
        )

        return payment

    def to_representation(self, instance: BillingPayment):
        return {
            "invoice_id": instance.invoice_id,
            "reference_id": instance.reference_id,
            "checkout_url": instance.checkout_url,
            "amount": str(instance.amount),
            "currency": instance.currency,
            "status": instance.status,
        }


class BillingStatusSerializer(serializers.Serializer):
    plan = serializers.CharField()
    tier = serializers.CharField()
    status = serializers.CharField()
    plan_expires_at = serializers.DateField(allow_null=True)
    invoice_id = serializers.CharField(allow_blank=True)
    reference_id = serializers.CharField(allow_blank=True)

    @classmethod
    def from_subscription(
        cls, subscription: Subscription | None, payment: BillingPayment | None
    ):
        plan_name = subscription.plan.name if subscription else "Free"
        plan_tier = subscription.plan.tier if subscription else Plan.Tier.BASIC
        status = subscription.status if subscription else Subscription.Status.EXPIRED
        expires_at = subscription.end_date if subscription else None
        return cls(
            {
                "plan": plan_name,
                "tier": plan_tier,
                "status": status,
                "plan_expires_at": expires_at,
                "invoice_id": payment.invoice_id if payment else "",
                "reference_id": payment.reference_id if payment else "",
            }
        )


def activate_subscription(clinic, plan: Plan) -> Subscription:
    start_date = timezone.now().date()
    end_date = start_date + timedelta(days=30)
    subscription, _ = Subscription.objects.update_or_create(
        clinic=clinic,
        defaults={
            "plan": plan,
            "status": Subscription.Status.ACTIVE,
            "start_date": start_date,
            "end_date": end_date,
        },
    )
    return subscription
