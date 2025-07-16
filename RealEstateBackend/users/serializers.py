
from rest_framework import serializers
from .models import CustomUser, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('address', 'phone_number', 'eth_address')

class CustomUserSerializer(serializers.ModelSerializer):
    userprofile = UserProfileSerializer()

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'user_type', 'userprofile')

    def create(self, validated_data):
        userprofile_data = validated_data.pop('userprofile')
        user = CustomUser.objects.create(**validated_data)
        UserProfile.objects.create(user=user, **userprofile_data)
        return user
