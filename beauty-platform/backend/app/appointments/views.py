from datetime import datetime, time

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import permissions, viewsets
from rest_framework.exceptions import NotFound

from appointments.models import Appointment, Procedure
from appointments.serializers import AppointmentSerializer, ProcedureSerializer
from billing.limits import PlanAction, check_plan_limits
from clinics.models import Clinic


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        queryset = Appointment.objects.filter(clinic=clinic)

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        start = self.request.query_params.get("start")
        end = self.request.query_params.get("end")

        def _parse_dt(value: str | None, is_end: bool = False) -> datetime | None:
            if not value:
                return None
            dt = parse_datetime(value)
            if dt:
                return timezone.make_aware(dt) if timezone.is_naive(dt) else dt
            date_val = parse_date(value)
            if date_val:
                if is_end:
                    return timezone.make_aware(
                        datetime.combine(date_val, time.max.replace(microsecond=0))
                    )
                return timezone.make_aware(datetime.combine(date_val, time.min))
            return None

        start_dt = _parse_dt(start)
        end_dt = _parse_dt(end, is_end=True)

        if start_dt:
            queryset = queryset.filter(scheduled_time__gte=start_dt)
        if end_dt:
            queryset = queryset.filter(scheduled_time__lte=end_dt)

        return queryset

    def perform_create(self, serializer):
        clinic_id = self.request.user.clinic_id
        if not clinic_id:
            raise NotFound("setup_required")
        with transaction.atomic():
            clinic = Clinic.objects.select_for_update().get(pk=clinic_id)
            check_plan_limits(clinic, PlanAction.CREATE_APPOINTMENT)
            serializer.save(clinic=clinic)


class ProcedureViewSet(viewsets.ModelViewSet):
    serializer_class = ProcedureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        return Procedure.objects.filter(appointment__clinic=clinic)

    def perform_create(self, serializer):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        performed_by = serializer.validated_data.get("performed_by") or self.request.user
        serializer.save(performed_by=performed_by)
