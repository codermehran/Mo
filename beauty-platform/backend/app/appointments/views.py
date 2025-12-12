from rest_framework import permissions, viewsets
from rest_framework.exceptions import NotFound

from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from billing.limits import PlanAction, check_plan_limits


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        return Appointment.objects.filter(clinic=clinic)

    def perform_create(self, serializer):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        check_plan_limits(clinic, PlanAction.CREATE_APPOINTMENT)
        serializer.save(clinic=clinic)
