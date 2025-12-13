import hashlib
import hmac
import logging
import secrets
from datetime import timedelta
from typing import Optional

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from kavenegar import APIException, HTTPException, KavenegarAPI
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPRequest
from .serializers import RequestOTPSerializer, VerifyOTPSerializer

User = get_user_model()

OTP_TTL_SECONDS = 120
OTP_RATE_LIMIT = 3
OTP_RATE_WINDOW_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_IP_VERIFY_LIMIT = 10

logger = logging.getLogger(__name__)


def _hash_code(code: str, phone_number: str) -> str:
    message = f"{phone_number}|{code}".encode("utf-8")
    secret = settings.SECRET_KEY.encode("utf-8")
    return hmac.new(secret, message, hashlib.sha256).hexdigest()


def _get_client_ip(request) -> Optional[str]:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _mask_phone(phone_number: str) -> str:
    if len(phone_number) <= 4:
        return "***" + phone_number[-2:]
    return f"***{phone_number[-4:]}"


def _send_kavenegar_otp(phone_number: str, code: str, purpose: str) -> None:
    api_key = getattr(settings, "KAVENEGAR_API_KEY", None)
    if not api_key:
        raise ValueError("Kavenegar API key is not configured")

    template_map = {
        OTPRequest.Purpose.LOGIN: getattr(settings, "KAVENEGAR_LOGIN_TEMPLATE", None),
        OTPRequest.Purpose.RECOVERY: getattr(settings, "KAVENEGAR_RECOVERY_TEMPLATE", None),
    }
    template = template_map.get(purpose)
    if not template:
        raise ValueError("Kavenegar template is not configured for the requested purpose")

    api = KavenegarAPI(api_key)
    try:
        api.verify_lookup(
            {"receptor": phone_number, "token": code, "template": template}
        )
    except (APIException, HTTPException) as exc:  # pragma: no cover - network dependent
        raise ValueError(f"Failed to send OTP via Kavenegar: {exc}") from exc


class RequestOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data["phone_number"]
        purpose = serializer.validated_data["purpose"]
        client_ip = _get_client_ip(request)
        now = timezone.now()
        window_start = now - timedelta(minutes=OTP_RATE_WINDOW_MINUTES)

        phone_count = OTPRequest.objects.filter(
            phone_number=phone_number, created_at__gte=window_start
        ).count()
        ip_count = (
            OTPRequest.objects.filter(ip_address=client_ip, created_at__gte=window_start).count()
            if client_ip
            else 0
        )

        if phone_count >= OTP_RATE_LIMIT or ip_count >= OTP_RATE_LIMIT:
            logger.warning(
                "OTP request rate limit hit for phone=%s ip=%s purpose=%s",
                _mask_phone(phone_number),
                client_ip,
                purpose,
            )
            return Response(
                {"detail": "Rate limit exceeded for OTP requests."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            return Response(
                {"detail": "No user is registered with this phone number."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except User.MultipleObjectsReturned:
            return Response(
                {"detail": "Multiple users share this phone number. Please contact support."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code = f"{secrets.randbelow(1_000_000):06d}"
        otp = OTPRequest.objects.create(
            user=user,
            phone_number=phone_number,
            purpose=purpose,
            code_hash=_hash_code(code, phone_number),
            expires_at=now + timedelta(seconds=OTP_TTL_SECONDS),
            ip_address=client_ip,
            sent_count=phone_count + 1,
        )

        try:
            _send_kavenegar_otp(phone_number, code, purpose)
        except ValueError as exc:
            otp.delete()
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        logger.info(
            "OTP sent for phone=%s ip=%s purpose=%s attempt=%s",
            _mask_phone(phone_number),
            client_ip,
            purpose,
            otp.sent_count,
        )

        return Response(
            {
                "sent_count": otp.sent_count,
                "expires_in": OTP_TTL_SECONDS,
                "purpose": purpose,
            },
            status=status.HTTP_200_OK,
        )


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data["phone_number"]
        code = serializer.validated_data["code"]
        purpose = serializer.validated_data["purpose"]
        client_ip = _get_client_ip(request)

        if client_ip:
            cache_key = f"otp-verify:{client_ip}:{purpose}"
            attempts_from_ip = cache.get(cache_key, 0) + 1
            cache.set(
                cache_key,
                attempts_from_ip,
                OTP_RATE_WINDOW_MINUTES * 60,
            )
            if attempts_from_ip > OTP_IP_VERIFY_LIMIT:
                logger.warning(
                    "OTP verify blocked due to IP limit phone=%s ip=%s purpose=%s attempts=%s",
                    _mask_phone(phone_number),
                    client_ip,
                    purpose,
                    attempts_from_ip,
                )
                return Response(
                    {"detail": "Too many verification attempts from this IP."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        otp = (
            OTPRequest.objects.filter(
                phone_number=phone_number,
                purpose=purpose,
                is_verified=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp:
            return Response(
                {"detail": "No pending OTP found for this phone number."},
                status=status.HTTP_404_NOT_FOUND,
            )

        otp.attempt_count += 1
        otp.save(update_fields=["attempt_count"])

        if otp.attempt_count > OTP_MAX_ATTEMPTS:
            logger.warning(
                "OTP verify locked due to attempts phone=%s ip=%s purpose=%s attempts=%s",
                _mask_phone(phone_number),
                client_ip,
                purpose,
                otp.attempt_count,
            )
            return Response(
                {"detail": "Too many verification attempts.", "attempts": otp.attempt_count},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if VerifyOTPSerializer.is_expired(otp):
            return Response(
                {"detail": "OTP code has expired.", "attempts": otp.attempt_count},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not hmac.compare_digest(otp.code_hash, _hash_code(code, phone_number)):
            logger.info(
                "OTP verification failed phone=%s ip=%s purpose=%s attempts=%s",
                _mask_phone(phone_number),
                client_ip,
                purpose,
                otp.attempt_count,
            )
            return Response(
                {"detail": "Invalid OTP code.", "attempts": otp.attempt_count},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp.is_verified = True
        otp.save(update_fields=["is_verified"])

        logger.info(
            "OTP verified phone=%s ip=%s purpose=%s attempts=%s",
            _mask_phone(phone_number),
            client_ip,
            purpose,
            otp.attempt_count,
        )

        user = otp.user
        if not user:
            try:
                user = User.objects.get(phone_number=phone_number)
            except User.MultipleObjectsReturned:
                return Response(
                    {
                        "detail": "Multiple users share this phone number. Please contact support.",
                        "attempts": otp.attempt_count,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            except User.DoesNotExist:
                return Response(
                    {"detail": "No user is registered with this phone number."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        response_data = {
            "attempts": otp.attempt_count,
            "user_id": user.id,
            "role": user.role,
            "requires_setup": user.clinic_id is None,
        }
        if user.clinic_id:
            response_data["clinic_id"] = user.clinic_id
        response = Response(response_data)

        cookie_secure = (
            True
            if str(settings.JWT_COOKIE_SAMESITE).lower() == "none"
            else settings.JWT_COOKIE_SECURE
        )
        # Browsers require Secure when SameSite=None; enforce to keep cookies usable.

        response.set_cookie(
            settings.JWT_ACCESS_COOKIE_NAME,
            str(access_token),
            httponly=True,
            secure=cookie_secure,
            samesite=settings.JWT_COOKIE_SAMESITE,
            domain=settings.JWT_COOKIE_DOMAIN,
            path=settings.JWT_COOKIE_PATH,
            expires=timezone.now() + settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"],
        )
        response.set_cookie(
            settings.JWT_REFRESH_COOKIE_NAME,
            str(refresh),
            httponly=True,
            secure=cookie_secure,
            samesite=settings.JWT_COOKIE_SAMESITE,
            domain=settings.JWT_COOKIE_DOMAIN,
            path=settings.JWT_COOKIE_PATH,
            expires=timezone.now() + settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
        )

        return response


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh") or request.COOKIES.get(
            settings.JWT_REFRESH_COOKIE_NAME
        )
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(
            settings.JWT_ACCESS_COOKIE_NAME,
            domain=settings.JWT_COOKIE_DOMAIN,
            path=settings.JWT_COOKIE_PATH,
        )
        response.delete_cookie(
            settings.JWT_REFRESH_COOKIE_NAME,
            domain=settings.JWT_COOKIE_DOMAIN,
            path=settings.JWT_COOKIE_PATH,
        )
        return response


class RefreshTokenView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh") or request.COOKIES.get(
            settings.JWT_REFRESH_COOKIE_NAME
        )
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        body = {k: v for k, v in data.items() if k not in {"access", "refresh"}}
        if not body:
            body = {"detail": "token_refreshed"}
        response = Response(body)

        cookie_secure = (
            True
            if str(settings.JWT_COOKIE_SAMESITE).lower() == "none"
            else settings.JWT_COOKIE_SECURE
        )
        # Browsers require Secure when SameSite=None; enforce to keep cookies usable.
        if "access" in data:
            response.set_cookie(
                settings.JWT_ACCESS_COOKIE_NAME,
                data["access"],
                httponly=True,
                secure=cookie_secure,
                samesite=settings.JWT_COOKIE_SAMESITE,
                domain=settings.JWT_COOKIE_DOMAIN,
                path=settings.JWT_COOKIE_PATH,
                expires=timezone.now() + settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"],
            )
        if "refresh" in data:
            response.set_cookie(
                settings.JWT_REFRESH_COOKIE_NAME,
                data["refresh"],
                httponly=True,
                secure=cookie_secure,
                samesite=settings.JWT_COOKIE_SAMESITE,
                domain=settings.JWT_COOKIE_DOMAIN,
                path=settings.JWT_COOKIE_PATH,
                expires=timezone.now() + settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
            )
        return response
