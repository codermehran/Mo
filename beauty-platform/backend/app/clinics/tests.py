from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import serializers
from rest_framework.test import APIRequestFactory

from .serializers import StaffSerializer

User = get_user_model()


class StaffSerializerTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.owner = User.objects.create_user(
            username="owner",
            email="owner@example.com",
            password="password123",
            role=User.Role.CLINIC_OWNER,
        )
        self.staff_user = User.objects.create_user(
            username="staff",
            email="staff@example.com",
            password="password123",
            role=User.Role.STAFF,
        )

    def test_role_field_read_only_on_create(self):
        request = self.factory.post("/staff/")
        request.user = self.owner

        serializer = StaffSerializer(
            data={
                "username": "newstaff",
                "email": "newstaff@example.com",
                "role": User.Role.ADMIN,
            },
            context={"request": request},
        )

        with self.assertRaises(serializers.ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_role_field_read_only_on_update(self):
        target_user = User.objects.create_user(
            username="target",
            email="target@example.com",
            password="password123",
            role=User.Role.STAFF,
        )
        request = self.factory.patch("/staff/1/")
        request.user = self.owner

        serializer = StaffSerializer(
            instance=target_user,
            data={"role": User.Role.CLINIC_OWNER},
            partial=True,
            context={"request": request},
        )

        with self.assertRaises(serializers.ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_updates_preserve_existing_role(self):
        request = self.factory.patch("/staff/2/")
        request.user = self.owner

        serializer = StaffSerializer(
            instance=self.staff_user,
            data={"first_name": "Updated"},
            partial=True,
            context={"request": request},
        )

        self.assertTrue(serializer.is_valid(raise_exception=True))
        updated_user = serializer.save()
        self.assertEqual(updated_user.role, User.Role.STAFF)
