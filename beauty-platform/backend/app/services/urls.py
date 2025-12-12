from django.urls import include, path
from rest_framework.routers import DefaultRouter

from services.views import ServiceViewSet

router = DefaultRouter()
router.register(r"services", ServiceViewSet, basename="services")

urlpatterns = [path("", include(router.urls))]
