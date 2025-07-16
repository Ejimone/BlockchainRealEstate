from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import CustomUser

class UserTests(APITestCase):
    def test_create_user(self):
        """
        Ensure we can create a new user.
        """
        url = reverse('user-list')
        data = {
            'username': 'testuser',
            'password': 'testpassword',
            'email': 'test@example.com',
            'user_type': 'buyer',
            'userprofile': {}
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CustomUser.objects.count(), 1)
        self.assertEqual(CustomUser.objects.get().username, 'testuser')

    def test_get_auth_token(self):
        """
        Ensure a user can obtain an authentication token.
        """
        # First, create a user
        user = CustomUser.objects.create_user(username='testuser', password='testpassword', user_type='buyer')

        # Now, try to get a token
        url = reverse('api-token-auth')
        data = {'username': 'testuser', 'password': 'testpassword'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('token' in response.data)
