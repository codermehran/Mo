from django.urls import include, path
from rest_framework.routers import DefaultRouter

from appointments.views import AppointmentViewSet, ProcedureViewSet

router = DefaultRouter()
router.register(r"appointments", AppointmentViewSet, basename="appointments")
router.register(r"procedures", ProcedureViewSet, basename="procedures")

urlpatterns = [path("", include(router.urls))]
