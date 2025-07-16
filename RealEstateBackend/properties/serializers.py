
from rest_framework import serializers
from .models import Property, Offer, Transaction
from users.serializers import CustomUserSerializer

class PropertySerializer(serializers.ModelSerializer):
    seller = CustomUserSerializer(read_only=True)
    buyer = CustomUserSerializer(read_only=True)
    agent = CustomUserSerializer(read_only=True)

    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = ('seller', 'buyer', 'transaction_hash')

class OfferSerializer(serializers.ModelSerializer):
    buyer = CustomUserSerializer(read_only=True)

    class Meta:
        model = Offer
        fields = '__all__'
        read_only_fields = ('buyer', 'transaction_hash')

class TransactionSerializer(serializers.ModelSerializer):
    seller = CustomUserSerializer(read_only=True)
    buyer = CustomUserSerializer(read_only=True)
    property = PropertySerializer(read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'

class InspectionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['is_inspection_passed']

class OfferActionSerializer(serializers.Serializer):
    pass
