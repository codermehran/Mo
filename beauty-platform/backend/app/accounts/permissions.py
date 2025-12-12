from django.contrib.auth import get_user_model
from rest_framework.permissions import BasePermission


User = get_user_model()


class IsClinicOwner(BasePermission):
    """Allow access only to clinic owners."""

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.role == User.Role.CLINIC_OWNER)


class IsClinicStaff(BasePermission):
    """Allow access only to clinic staff."""

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.role == User.Role.STAFF)


class IsPractitioner(BasePermission):
    """Allow access only to practitioners/doctors."""

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.role == User.Role.PRACTITIONER)
