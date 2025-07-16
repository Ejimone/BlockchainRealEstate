
from rest_framework import serializers
from .models import CustomUser, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('address', 'phone_number')

class CustomUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'user_type', 'profile')

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        user = CustomUser.objects.create(**validated_data)
        UserProfile.objects.create(user=user, **profile_data)
        return user
