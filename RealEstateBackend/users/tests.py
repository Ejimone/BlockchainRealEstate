from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import CustomUser, UserProfile

class UserTests(APITestCase):
    def test_create_buyer_user(self):
        """
        Ensure we can create a new buyer user and their profile.
        """
        url = reverse('user-list')
        data = {
            'username': 'testbuyer',
            'password': 'testpassword',
            'email': 'buyer@example.com',
            'user_type': 'buyer',
            'userprofile': {
                'address': '123 Buyer St',
                'phone_number': '111-222-3333',
                'eth_address': '0x1234567890123456789012345678901234567890' # 42 chars
            }
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Buyer User Creation Failed: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CustomUser.objects.count(), 1)
        user = CustomUser.objects.get(username='testbuyer')
        self.assertEqual(user.user_type, 'buyer')
        self.assertIsNotNone(user.userprofile)
        self.assertEqual(user.userprofile.eth_address, '0x1234567890123456789012345678901234567890')

    def test_create_seller_user(self):
        """
        Ensure we can create a new seller user and their profile.
        """
        url = reverse('user-list')
        data = {
            'username': 'testseller',
            'password': 'testpassword',
            'email': 'seller@example.com',
            'user_type': 'seller',
            'userprofile': {
                'address': '456 Seller Ave',
                'phone_number': '444-555-6666',
                'eth_address': '0xabcdef1234567890abcdef1234567890abcdef12' # 42 chars
            }
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Seller User Creation Failed: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CustomUser.objects.count(), 1)
        user = CustomUser.objects.get(username='testseller')
        self.assertEqual(user.user_type, 'seller')
        self.assertIsNotNone(user.userprofile)
        self.assertEqual(user.userprofile.eth_address, '0xabcdef1234567890abcdef1234567890abcdef12')

    def test_create_appraiser_user(self):
        """
        Ensure we can create a new appraiser user and their profile.
        """
        url = reverse('user-list')
        eth_address_val = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' # 42 chars
        print(f"Appraiser ETH Address Length: {len(eth_address_val)}")
        data = {
            'username': 'testappraiser',
            'password': 'testpassword',
            'email': 'appraiser@example.com',
            'user_type': 'appraiser',
            'userprofile': {
                'address': '789 Appraiser Rd',
                'phone_number': '777-888-9999',
                'eth_address': '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' # Corrected to 42 chars
            }
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Appraiser User Creation Failed: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CustomUser.objects.count(), 1)
        user = CustomUser.objects.get(username='testappraiser')
        self.assertEqual(user.user_type, 'appraiser')
        self.assertIsNotNone(user.userprofile)
        self.assertEqual(user.userprofile.eth_address, '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')

    def test_create_inspector_user(self):
        """
        Ensure we can create a new inspector user and their profile.
        """
        url = reverse('user-list')
        data = {
            'username': 'testinspector',
            'password': 'testpassword',
            'email': 'inspector@example.com',
            'user_type': 'inspector',
            'userprofile': {
                'address': '101 Inspector Ln',
                'phone_number': '000-111-2222',
                'eth_address': '0xcccccccccccccccccccccccccccccccccccccccc' # 42 chars
            }
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Inspector User Creation Failed: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CustomUser.objects.count(), 1)
        user = CustomUser.objects.get(username='testinspector')
        self.assertEqual(user.user_type, 'inspector')
        self.assertIsNotNone(user.userprofile)
        self.assertEqual(user.userprofile.eth_address, '0xcccccccccccccccccccccccccccccccccccccccc')

    def test_get_auth_token(self):
        """
        Ensure a user can obtain an authentication token.
        """
        # First, create a user
        user = CustomUser.objects.create_user(username='testuser', password='testpassword', user_type='buyer')
        UserProfile.objects.create(user=user) # Create a profile for the user

        # Now, try to get a token
        url = reverse('api-token-auth')
        data = {'username': 'testuser', 'password': 'testpassword'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('token' in response.data)




        