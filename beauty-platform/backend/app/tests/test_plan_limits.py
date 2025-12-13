import pytest
from rest_framework import status

from billing.limits import PlanLimitExceeded

pytestmark = pytest.mark.django_db


def test_create_patient_respects_free_plan_limit(
    api_client, clinic_factory, patient_factory, user_factory, settings
):
    settings.FREE_MAX_PATIENTS = 1
    clinic = clinic_factory()
    user = user_factory(clinic=clinic)
    patient_factory(clinic=clinic)

    api_client.force_authenticate(user=user)
    response = api_client.post(
        "/api/patients/",
        {
            "first_name": "Extra",
            "last_name": "Patient",
            "phone_number": "09129999999",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_402_PAYMENT_REQUIRED
    assert response.data["detail"] == PlanLimitExceeded.default_detail
