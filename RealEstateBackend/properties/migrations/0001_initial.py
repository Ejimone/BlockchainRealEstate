# Generated by Django 5.2.4 on 2025-07-16 18:16

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Offer",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                ("is_active", models.BooleanField(default=True)),
                ("expires_at", models.DateTimeField()),
            ],
        ),
        migrations.CreateModel(
            name="Property",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("location", models.CharField(max_length=255)),
                ("description", models.TextField()),
                ("is_listed", models.BooleanField(default=False)),
                ("is_sold", models.BooleanField(default=False)),
                (
                    "offer_amount",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=10, null=True
                    ),
                ),
                ("is_inspection_passed", models.BooleanField(default=False)),
                ("financing_approved", models.BooleanField(default=False)),
                ("listed_at", models.DateTimeField(auto_now_add=True)),
                ("auction_end_time", models.DateTimeField(blank=True, null=True)),
                (
                    "minimum_bid",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=10, null=True
                    ),
                ),
                (
                    "agent_commission",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=5, null=True
                    ),
                ),
                (
                    "property_type",
                    models.CharField(
                        choices=[
                            ("RESIDENTIAL", "Residential"),
                            ("COMMERCIAL", "Commercial"),
                            ("LAND", "Land"),
                            ("APARTMENT", "Apartment"),
                            ("OFFICE", "Office"),
                        ],
                        max_length=20,
                    ),
                ),
                ("area", models.PositiveIntegerField(blank=True, null=True)),
                ("bedrooms", models.PositiveIntegerField(blank=True, null=True)),
                ("bathrooms", models.PositiveIntegerField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="Transaction",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                (
                    "transaction_hash",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
            ],
        ),
    ]
