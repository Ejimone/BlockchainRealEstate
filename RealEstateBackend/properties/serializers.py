
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

class OfferSerializer(serializers.ModelSerializer):
    buyer = CustomUserSerializer(read_only=True)

    class Meta:
        model = Offer
        fields = '__all__'

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
