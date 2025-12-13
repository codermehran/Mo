import pytest
from rest_framework import status

from accounts.models import User

pytestmark = pytest.mark.django_db


def test_staff_user_cannot_manage_staff(api_client, clinic_factory, user_factory):
    clinic = clinic_factory()
    staff_user = user_factory(clinic=clinic, role=User.Role.STAFF)

    api_client.force_authenticate(user=staff_user)
    list_response = api_client.get("/api/staff/")
    create_response = api_client.post(
        "/api/staff/",
        {"username": "blocked", "email": "blocked@example.com", "phone_number": "09998887777"},
        format="json",
    )

    assert list_response.status_code == status.HTTP_403_FORBIDDEN
    assert create_response.status_code == status.HTTP_403_FORBIDDEN


def test_owner_queryset_restricted_to_own_clinic(api_client, clinic_factory, user_factory):
    clinic_a = clinic_factory(code="clinic-a")
    clinic_b = clinic_factory(code="clinic-b")
    owner_a = user_factory(clinic=clinic_a, role=User.Role.CLINIC_OWNER)
    staff_b = user_factory(clinic=clinic_b, role=User.Role.STAFF)

    api_client.force_authenticate(user=owner_a)
    response = api_client.get(f"/api/staff/{staff_b.id}/")

    assert response.status_code == status.HTTP_404_NOT_FOUND
