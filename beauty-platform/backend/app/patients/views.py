from rest_framework import permissions, viewsets
from rest_framework.exceptions import NotFound

from billing.limits import PlanAction, check_plan_limits
from patients.models import Patient
from patients.serializers import PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        return Patient.objects.filter(clinic=clinic)

    def perform_create(self, serializer):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        check_plan_limits(clinic, PlanAction.CREATE_PATIENT)
        serializer.save(clinic=clinic)
