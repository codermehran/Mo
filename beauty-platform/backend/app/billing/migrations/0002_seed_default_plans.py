from django.db import migrations


DEFAULT_PLANS = [
    {
        "name": "Basic",
        "tier": "BASIC",
        "monthly_price": 0,
        "max_staff": 5,
        "max_patients": 500,
    },
    {
        "name": "Standard",
        "tier": "STANDARD",
        "monthly_price": 49,
        "max_staff": 25,
        "max_patients": 5000,
    },
]


def seed_plans(apps, schema_editor):
    Plan = apps.get_model("billing", "Plan")
    for plan_data in DEFAULT_PLANS:
        Plan.objects.update_or_create(name=plan_data["name"], defaults=plan_data)


def unseed_plans(apps, schema_editor):
    Plan = apps.get_model("billing", "Plan")
    Plan.objects.filter(name__in=[plan["name"] for plan in DEFAULT_PLANS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_plans, unseed_plans),
    ]
