from django.db import models
from users.models import CustomUser

class Property(models.Model):
    PROPERTY_TYPE_CHOICES = (
        ('RESIDENTIAL', 'Residential'),
        ('COMMERCIAL', 'Commercial'),
        ('LAND', 'Land'),
        ('APARTMENT', 'Apartment'),
        ('OFFICE', 'Office'),
    )

    seller = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='properties')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=255)
    description = models.TextField()
    is_listed = models.BooleanField(default=False)
    is_sold = models.BooleanField(default=False)
    buyer = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchased_properties')
    offer_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_inspection_passed = models.BooleanField(default=False)
    financing_approved = models.BooleanField(default=False)
    listed_at = models.DateTimeField(auto_now_add=True)
    auction_end_time = models.DateTimeField(null=True, blank=True)
    minimum_bid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    agent = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='agent_properties')
    agent_commission = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES)
    area = models.PositiveIntegerField(null=True, blank=True)
    bedrooms = models.PositiveIntegerField(null=True, blank=True)
    bathrooms = models.PositiveIntegerField(null=True, blank=True)
    transaction_hash = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.location

class Offer(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='offers')
    buyer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='offers_made')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField()
    transaction_hash = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f'Offer for {self.property} by {self.buyer}'

class Transaction(models.Model):
    property = models.OneToOneField(Property, on_delete=models.CASCADE, related_name='transaction')
    seller = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sales')
    buyer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='purchases')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    transaction_hash = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f'Transaction for {self.property}'