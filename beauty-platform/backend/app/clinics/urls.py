from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ClinicView, MyClinicView, StaffViewSet

router = DefaultRouter()
router.register(r"staff", StaffViewSet, basename="staff")


urlpatterns = [
    path("clinic", ClinicView.as_view(), name="clinic-create"),
    path("clinic/me", MyClinicView.as_view(), name="clinic-me"),
    path("", include(router.urls)),
]
