# Generated by Django 5.2.4 on 2025-07-16 18:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="eth_address",
            field=models.CharField(blank=True, max_length=42, null=True),
        ),
    ]
