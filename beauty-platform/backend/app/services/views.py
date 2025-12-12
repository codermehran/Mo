from rest_framework import permissions, viewsets
from rest_framework.exceptions import NotFound

from services.models import Service
from services.serializers import ServiceSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        return Service.objects.filter(clinic=clinic)

    def perform_create(self, serializer):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        serializer.save(clinic=clinic)

    def perform_update(self, serializer):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        serializer.save(clinic=clinic)
