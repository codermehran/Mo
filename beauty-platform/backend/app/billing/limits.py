from __future__ import annotations

from enum import Enum
from typing import Iterable, Optional

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import QuerySet
from rest_framework import status
from rest_framework.exceptions import APIException

from appointments.models import Appointment
from billing.models import Plan, Subscription
from patients.models import Patient

User = get_user_model()


class PlanAction(str, Enum):
    CREATE_STAFF = "CREATE_STAFF"
    CREATE_PATIENT = "CREATE_PATIENT"
    CREATE_APPOINTMENT = "CREATE_APPOINTMENT"


class PlanLimitExceeded(APIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = "PLAN_LIMIT"
    default_code = "plan_limit"


def _is_paid_plan(subscription: Optional[Subscription]) -> bool:
    if not subscription:
        return False
    if subscription.status not in {Subscription.Status.ACTIVE, Subscription.Status.TRIAL}:
        return False
    plan = subscription.plan
    return plan and plan.tier != Plan.Tier.BASIC and plan.monthly_price > 0

def _count_staff(clinic) -> int:
    staff_roles: Iterable[str] = [User.Role.PRACTITIONER, User.Role.STAFF]
    queryset: QuerySet[User] = clinic.users.filter(role__in=staff_roles)
    return queryset.count()


def check_plan_limits(clinic, action: PlanAction | str) -> None:
    try:
        subscription = clinic.subscription
    except Subscription.DoesNotExist:
        subscription = None

    if _is_paid_plan(subscription):
        return

    action_value = action.value if isinstance(action, Enum) else str(action)

    if action_value == PlanAction.CREATE_STAFF.value:
        current_total = _count_staff(clinic)
        plan_limit = getattr(settings, "FREE_MAX_STAFF", 0)
    elif action_value == PlanAction.CREATE_PATIENT.value:
        current_total = Patient.objects.filter(clinic=clinic).count()
        plan_limit = getattr(settings, "FREE_MAX_PATIENTS", 0)
    elif action_value == PlanAction.CREATE_APPOINTMENT.value:
        current_total = Appointment.objects.filter(clinic=clinic).count()
        plan_limit = getattr(settings, "FREE_MAX_APPOINTMENTS", 0)
    else:
        return

    if plan_limit and current_total >= plan_limit:
        raise PlanLimitExceeded()
