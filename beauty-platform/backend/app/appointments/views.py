from django.db import transaction
from rest_framework import permissions, viewsets
from rest_framework.exceptions import NotFound

from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from billing.limits import PlanAction, check_plan_limits
from clinics.models import Clinic


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        return Appointment.objects.filter(clinic=clinic)

    def perform_create(self, serializer):
        clinic_id = self.request.user.clinic_id
        if not clinic_id:
            raise NotFound("setup_required")
        with transaction.atomic():
            clinic = Clinic.objects.select_for_update().get(pk=clinic_id)
            check_plan_limits(clinic, PlanAction.CREATE_APPOINTMENT)
            serializer.save(clinic=clinic)
