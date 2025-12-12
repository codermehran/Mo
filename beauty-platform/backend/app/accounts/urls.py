from django.urls import path

from .views import LogoutView, RefreshTokenView, RequestOTPView, VerifyOTPView

urlpatterns = [
    path("auth/request-otp", RequestOTPView.as_view(), name="request-otp"),
    path("auth/verify-otp", VerifyOTPView.as_view(), name="verify-otp"),
    path("auth/refresh", RefreshTokenView.as_view(), name="token-refresh"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
]
