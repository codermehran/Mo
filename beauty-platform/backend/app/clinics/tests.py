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

    def test_non_owner_cannot_set_role_on_create(self):
        request = self.factory.post("/staff/")
        request.user = self.staff_user

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

    def test_non_owner_cannot_set_role_on_update(self):
        target_user = User.objects.create_user(
            username="target",
            email="target@example.com",
            password="password123",
            role=User.Role.STAFF,
        )
        request = self.factory.patch("/staff/1/")
        request.user = self.staff_user

        serializer = StaffSerializer(
            instance=target_user,
            data={"role": User.Role.CLINIC_OWNER},
            partial=True,
            context={"request": request},
        )

        with self.assertRaises(serializers.ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_owner_can_set_role(self):
        target_user = User.objects.create_user(
            username="target2",
            email="target2@example.com",
            password="password123",
            role=User.Role.STAFF,
        )
        request = self.factory.patch("/staff/2/")
        request.user = self.owner

        serializer = StaffSerializer(
            instance=target_user,
            data={"role": User.Role.PRACTITIONER},
            partial=True,
            context={"request": request},
        )

        self.assertTrue(serializer.is_valid(raise_exception=True))
        updated_user = serializer.save()
        self.assertEqual(updated_user.role, User.Role.PRACTITIONER)
