import uuid
from datetime import timedelta

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
        invoice_id = uuid.uuid4().hex
        checkout_base = getattr(
            settings, "BITPAY_CHECKOUT_URL", "https://checkout.bitpay.com/invoice"
        )
        checkout_url = f"{checkout_base}/{reference_id}"

        payment = BillingPayment.objects.create(
            clinic=clinic,
            plan=plan,
            amount=plan.monthly_price,
            currency=currency,
            reference_id=reference_id,
            invoice_id=invoice_id,
            checkout_url=checkout_url,
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
