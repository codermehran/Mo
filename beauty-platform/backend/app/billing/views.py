import logging
from typing import ClassVar

import requests
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
        logger.info(
            "Checkout created for clinic_id=%s plan=%s by user=%s",
            clinic.id,
            getattr(serializer.validated_data.get("plan"), "id", serializer.validated_data.get("plan")),
            getattr(request.user, "id", None),
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BitPayWebhookView(APIView):
    permission_classes: ClassVar[tuple] = (permissions.AllowAny,)

    def _extract_params(self, request):
        data = request.data if hasattr(request, "data") else {}
        query = request.query_params if hasattr(request, "query_params") else {}
        trans_id = data.get("trans_id") or query.get("trans_id")
        id_get = data.get("id_get") or query.get("id_get")
        reference_id = data.get("factorId") or query.get("factorId")
        return trans_id, id_get, reference_id

    def post(self, request):
        trans_id, id_get, reference_id = self._extract_params(request)
        if not trans_id or not id_get:
            logger.warning(
                "BitPay webhook missing parameters trans_id=%s id_get=%s ref=%s",
                trans_id,
                id_get,
                reference_id,
            )
            return Response({"detail": "missing_parameters"}, status=status.HTTP_400_BAD_REQUEST)

        api_key = getattr(settings, "BITPAY_API_KEY", None)
        verify_url = getattr(
            settings, "BITPAY_VERIFY_URL", "https://bitpay.ir/payment/gateway-result-second"
        )
        if not api_key:
            logger.error("BitPay.ir verification failed: API key not configured")
            return Response({"detail": "configuration_error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        verify_payload = {
            "api": api_key,
            "trans_id": trans_id,
            "id_get": id_get,
            "json": 1,
        }

        try:
            response = requests.post(verify_url, data=verify_payload, timeout=10)
            response.raise_for_status()
            result = response.json()
        except requests.RequestException:  # pragma: no cover - external call
            logger.exception("BitPay.ir verification request failed")
            return Response({"detail": "verification_failed"}, status=status.HTTP_502_BAD_GATEWAY)
        except ValueError:
            logger.error("BitPay.ir verification returned non-JSON response")
            return Response({"detail": "invalid_response"}, status=status.HTTP_502_BAD_GATEWAY)

        reference_id = result.get("factorId") or reference_id
        if not reference_id:
            return Response({"detail": "missing_reference"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = BillingPayment.objects.select_related("clinic", "plan").get(
                reference_id=reference_id
            )
        except BillingPayment.DoesNotExist:
            logger.error(
                "BitPay webhook payment not found reference_id=%s trans_id=%s",
                reference_id,
                trans_id,
            )
            return Response({"detail": "payment_not_found"}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == BillingPayment.Status.SUCCESS:
            logger.info(
                "BitPay webhook already processed payment_id=%s reference_id=%s",
                payment.id,
                reference_id,
            )
            return Response({"detail": "already_processed"}, status=status.HTTP_200_OK)

        status_value = result.get("status")
        success_states = {1, "1", True, "SUCCESS", "success"}
        if status_value not in success_states:
            payment.status = BillingPayment.Status.FAILED
            payment.metadata = result
            payment.save(update_fields=["status", "metadata", "updated_at"])
            logger.warning(
                "BitPay payment failed payment_id=%s reference_id=%s status=%s",
                payment.id,
                reference_id,
                status_value,
            )
            return Response({"detail": "payment_failed"}, status=status.HTTP_202_ACCEPTED)

        with transaction.atomic():
            locked_payment = (
                BillingPayment.objects.select_for_update()
                .select_related("clinic", "plan")
                .get(pk=payment.pk)
            )
            if locked_payment.status == BillingPayment.Status.SUCCESS:
                logger.info(
                    "BitPay webhook already processed payment_id=%s reference_id=%s",
                    locked_payment.id,
                    reference_id,
                )
                return Response({"detail": "already_processed"}, status=status.HTTP_200_OK)
            locked_payment.mark_success(
                transaction_id=trans_id,
                invoice_id=id_get,
                metadata=result,
            )
            activate_subscription(locked_payment.clinic, locked_payment.plan)
            logger.info(
                "BitPay payment succeeded payment_id=%s clinic_id=%s plan_id=%s",
                locked_payment.id,
                locked_payment.clinic_id,
                locked_payment.plan_id,
            )

        return Response({"detail": "ok"}, status=status.HTTP_200_OK)

    def get(self, request):
        return self.post(request)


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
