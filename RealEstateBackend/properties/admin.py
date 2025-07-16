from django.contrib import admin
from .models import Property, Offer, Transaction

admin.site.register(Property)
admin.site.register(Offer)
admin.site.register(Transaction)