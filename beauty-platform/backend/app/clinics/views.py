from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsClinicOwner

from .models import Clinic
from .serializers import ClinicSerializer, StaffSerializer

User = get_user_model()


class ClinicView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.clinic:
            return Response(
                {"detail": "Clinic already assigned."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ClinicSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            clinic = serializer.save(owner=request.user)
            request.user.clinic = clinic
            request.user.role = User.Role.CLINIC_OWNER
            request.user.save(update_fields=["clinic", "role"])

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyClinicView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        clinic = request.user.clinic
        if not clinic:
            return Response({"detail": "setup_required"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClinicSerializer(clinic)
        return Response(serializer.data)

    def put(self, request):
        clinic = request.user.clinic
        if not clinic:
            return Response({"detail": "setup_required"}, status=status.HTTP_404_NOT_FOUND)
        if clinic.owner_id != request.user.id:
            raise PermissionDenied("You do not have permission to update this clinic.")
        serializer = ClinicSerializer(clinic, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class StaffViewSet(viewsets.ModelViewSet):
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated, IsClinicOwner]

    def get_queryset(self):
        clinic = self.request.user.clinic
        if not clinic:
            raise NotFound("setup_required")
        return User.objects.filter(clinic=clinic)

    def perform_create(self, serializer):
        if not self.request.user.clinic:
            raise NotFound("setup_required")
        serializer.save(clinic=self.request.user.clinic)

    def perform_update(self, serializer):
        if not self.request.user.clinic:
            raise NotFound("setup_required")
        serializer.save(clinic=self.request.user.clinic)
