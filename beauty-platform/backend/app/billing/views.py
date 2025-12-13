import hashlib
import hmac
import logging
from typing import ClassVar

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsClinicOwner
from .models import BillingPayment
from .serializers import (
    BillingStatusSerializer,
    CreateCheckoutSerializer,
    activate_subscription,
)


def _verify_signature(secret: str | None, raw_body: bytes, signature: str | None) -> bool:
    if not secret:
        return False
    if not signature:
        return False
    computed = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, computed)


logger = logging.getLogger(__name__)


class CreateCheckoutView(APIView):
    permission_classes: ClassVar[tuple] = (permissions.IsAuthenticated, IsClinicOwner)

    def post(self, request):
        try:
            clinic = request.user.clinic
        except ObjectDoesNotExist:
            clinic = None
        if not clinic:
            return Response({"detail": "setup_required"}, status=status.HTTP_404_NOT_FOUND)

        serializer = CreateCheckoutSerializer(data=request.data, context={"clinic": clinic})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BitPayWebhookView(APIView):
    permission_classes: ClassVar[tuple] = (permissions.AllowAny,)

    def post(self, request):
        token = request.headers.get("X-Webhook-Token")
        expected_token = getattr(settings, "BITPAY_WEBHOOK_TOKEN", None)
        if expected_token and token != expected_token:
            return Response({"detail": "invalid_token"}, status=status.HTTP_401_UNAUTHORIZED)
        if not expected_token and not getattr(settings, "BITPAY_WEBHOOK_SECRET", None):
            logger.error("BitPay webhook rejected: missing secret/token configuration")
            return Response({"detail": "webhook_disabled"}, status=status.HTTP_401_UNAUTHORIZED)

        signature = request.headers.get("X-Signature")
        secret = getattr(settings, "BITPAY_WEBHOOK_SECRET", None)
        if not _verify_signature(secret, request.body, signature):
            return Response({"detail": "invalid_signature"}, status=status.HTTP_401_UNAUTHORIZED)

        payload = request.data
        reference_id = payload.get("reference_id") or payload.get("id")
        invoice_id = payload.get("invoice_id") or reference_id
        payment_status = str(payload.get("status", "")).upper()
        transaction_id = payload.get("transaction_id") or ""
        metadata = payload.dict() if hasattr(payload, "dict") else dict(payload)

        if not reference_id:
            return Response({"detail": "missing_reference"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = BillingPayment.objects.select_related("clinic", "plan").get(
                reference_id=reference_id
            )
        except BillingPayment.DoesNotExist:
            return Response({"detail": "payment_not_found"}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == BillingPayment.Status.SUCCESS:
            return Response({"detail": "already_processed"}, status=status.HTTP_200_OK)

        success_states = {"SUCCESS", "CONFIRMED", "PAID", "COMPLETED", "COMPLETE"}
        if payment_status not in success_states:
            payment.status = BillingPayment.Status.FAILED
            payment.metadata = metadata
            payment.save(update_fields=["status", "metadata", "updated_at"])
            return Response({"detail": "ignored_status"}, status=status.HTTP_202_ACCEPTED)

        with transaction.atomic():
            locked_payment = (
                BillingPayment.objects.select_for_update()
                .select_related("clinic", "plan")
                .get(pk=payment.pk)
            )
            locked_payment.mark_success(
                transaction_id=transaction_id,
                invoice_id=invoice_id,
                metadata=metadata,
            )
            activate_subscription(locked_payment.clinic, locked_payment.plan)

        return Response({"detail": "ok"}, status=status.HTTP_200_OK)


class BillingStatusView(APIView):
    permission_classes: ClassVar[tuple] = (permissions.IsAuthenticated, IsClinicOwner)

    def get(self, request):
        try:
            clinic = request.user.clinic
        except ObjectDoesNotExist:
            clinic = None
        if not clinic:
            return Response({"detail": "setup_required"}, status=status.HTTP_404_NOT_FOUND)

        try:
            subscription = clinic.subscription
        except ObjectDoesNotExist:
            subscription = None
        latest_payment = (
            clinic.billing_payments.filter(status=BillingPayment.Status.SUCCESS)
            .order_by("-paid_at", "-created_at")
            .first()
        )
        serializer = BillingStatusSerializer.from_subscription(subscription, latest_payment)
        return Response(serializer.data)
