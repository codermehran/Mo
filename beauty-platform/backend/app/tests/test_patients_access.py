import pytest
from rest_framework import status

from patients.models import Patient

pytestmark = pytest.mark.django_db


def test_patient_access_scoped_to_user_clinic(api_client, clinic_factory, patient_factory, user_factory):
    clinic_a = clinic_factory()
    clinic_b = clinic_factory(code="clinic-b")
    user_a = user_factory(clinic=clinic_a)
    patient_b: Patient = patient_factory(clinic=clinic_b)

    api_client.force_authenticate(user=user_a)
    response = api_client.get(f"/api/patients/{patient_b.id}/")

    assert response.status_code == status.HTTP_404_NOT_FOUND
