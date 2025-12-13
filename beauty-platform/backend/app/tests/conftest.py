import itertools
from typing import Callable

import pytest
from rest_framework.test import APIClient

from accounts.models import User
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
