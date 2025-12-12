from django.db import transaction
from rest_framework import filters, permissions, viewsets
from rest_framework.exceptions import NotFound

from billing.limits import PlanAction, check_plan_limits
from patients.models import Patient
from patients.serializers import PatientSerializer
from clinics.models import Clinic


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = [
        "first_name",
        "last_name",
        "phone_number",
        "email",
    ]

    def get_queryset(self):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        return Patient.objects.filter(clinic=clinic)

    def perform_create(self, serializer):
        clinic_id = self.request.user.clinic_id
        if not clinic_id:
            raise NotFound("setup_required")
        with transaction.atomic():
            clinic = Clinic.objects.select_for_update().get(pk=clinic_id)
            check_plan_limits(clinic, PlanAction.CREATE_PATIENT)
            serializer.save(clinic=clinic)
