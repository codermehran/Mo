from django.urls import path

from .views import BillingStatusView, BitPayWebhookView, CreateCheckoutView

urlpatterns = [
    path("billing/create-checkout", CreateCheckoutView.as_view(), name="billing-create-checkout"),
    path("billing/webhook/bitpay", BitPayWebhookView.as_view(), name="billing-bitpay-webhook"),
    path("billing/status", BillingStatusView.as_view(), name="billing-status"),
]
