import itertools
import os
from datetime import timedelta
from typing import Callable

import django
import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "beauty_platform.settings_test")
django.setup()

from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from appointments.models import Appointment
from billing.models import BillingPayment, Plan
from clinics.models import Clinic
from patients.models import Patient
from services.models import Service


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def user_factory(django_user_model) -> Callable[..., User]:
    counter = itertools.count()

    def factory(**kwargs) -> User:
        index = next(counter)
        defaults = {
            "username": f"user{index}",
            "email": f"user{index}@example.com",
            "password": "password123",
            "phone_number": f"0912000{index:04d}",
        }
        defaults.update(kwargs)
        user = django_user_model.objects.create_user(**defaults)
        return user

    return factory


@pytest.fixture
def clinic_factory() -> Callable[..., Clinic]:
    counter = itertools.count()

    def factory(**kwargs) -> Clinic:
        index = next(counter)
        defaults = {"name": f"Clinic {index}", "code": f"clinic-{index}"}
        defaults.update(kwargs)
        return Clinic.objects.create(**defaults)

    return factory


@pytest.fixture
def patient_factory(clinic_factory) -> Callable[..., Patient]:
    counter = itertools.count()

    def factory(**kwargs) -> Patient:
        index = next(counter)
        clinic = kwargs.pop("clinic", clinic_factory())
        defaults = {
            "clinic": clinic,
            "first_name": "Test",
            "last_name": f"Patient{index}",
            "phone_number": f"0912300{index:04d}",
        }
        defaults.update(kwargs)
        return Patient.objects.create(**defaults)

    return factory


@pytest.fixture
def service_factory(clinic_factory) -> Callable[..., Service]:
    counter = itertools.count()

    def factory(**kwargs) -> Service:
        index = next(counter)
        clinic = kwargs.pop("clinic", clinic_factory())
        defaults = {
            "clinic": clinic,
            "name": f"Service {index}",
            "duration_minutes": 30,
            "base_price": 100,
        }
        defaults.update(kwargs)
        return Service.objects.create(**defaults)

    return factory


@pytest.fixture
def plan_factory() -> Callable[..., Plan]:
    counter = itertools.count()

    def factory(**kwargs) -> Plan:
        index = next(counter)
        defaults = {
            "name": f"Plan {index}",
            "tier": Plan.Tier.STANDARD,
            "monthly_price": 100,
        }
        defaults.update(kwargs)
        return Plan.objects.create(**defaults)

    return factory


@pytest.fixture
def billing_payment_factory(plan_factory, clinic_factory) -> Callable[..., BillingPayment]:
    counter = itertools.count()

    def factory(**kwargs) -> BillingPayment:
        index = next(counter)
        clinic = kwargs.get("clinic") or clinic_factory()
        plan = kwargs.get("plan") or plan_factory()
        defaults = {
            "clinic": clinic,
            "plan": plan,
            "amount": plan.monthly_price,
            "currency": "USD",
            "status": BillingPayment.Status.PENDING,
            "reference_id": f"ref-{index}",
        }
        defaults.update(kwargs)
        return BillingPayment.objects.create(**defaults)

    return factory


@pytest.fixture
def appointment_factory(
    clinic_factory, patient_factory, service_factory, user_factory
) -> Callable[..., Appointment]:
    counter = itertools.count()

    def factory(**kwargs) -> Appointment:
        index = next(counter)
        clinic = kwargs.pop("clinic", clinic_factory())
        patient = kwargs.pop("patient", patient_factory(clinic=clinic))
        service = kwargs.pop("service", service_factory(clinic=clinic))
        provider = kwargs.pop(
            "provider",
            user_factory(clinic=clinic, role=User.Role.PRACTITIONER),
        )
        defaults = {
            "clinic": clinic,
            "patient": patient,
            "service": service,
            "provider": provider,
            "scheduled_time": timezone.now() + timedelta(days=1),
            "duration_minutes": 30,
        }
        defaults.update(kwargs)
        return Appointment.objects.create(**defaults)

    return factory
