from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Property, Offer
from users.models import CustomUser, UserProfile
from unittest.mock import patch

class PropertyTests(APITestCase):
    def setUp(self):
        # Create users with different roles
        self.seller = CustomUser.objects.create_user(username='seller', password='password', user_type='seller')
        UserProfile.objects.create(user=self.seller, eth_address="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")

        self.buyer = CustomUser.objects.create_user(username='buyer', password='password', user_type='buyer')
        UserProfile.objects.create(user=self.buyer, eth_address="0x59c6995e998f97a5a004496c17f0ab241a74142305fd218621064954ee166979")

        self.appraiser = CustomUser.objects.create_user(username='appraiser', password='password', user_type='appraiser')
        UserProfile.objects.create(user=self.appraiser, eth_address="0x70997970c51812dc3a010c7d01fd1c0aa0fcd34f")

        self.inspector = CustomUser.objects.create_user(username='inspector', password='password', user_type='inspector')
        UserProfile.objects.create(user=self.inspector, eth_address="0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199")

        # Authenticate the users
        self.client.force_authenticate(user=self.seller)

    @patch('RealEstateBackend.blockchain.list_property_on_blockchain')
    def test_create_property(self, mock_list_property):
        """
        Ensure a seller can create a new property.
        """
        mock_list_property.return_value = "0xtransactionhash123"
        url = reverse('property-list')
        data = {
            'price': 100000.00,
            'location': 'Test Location',
            'description': 'A test property',
            'property_type': 'RESIDENTIAL'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Property.objects.count(), 1)
        self.assertEqual(Property.objects.get().location, 'Test Location')
        mock_list_property.assert_called_once()

    def test_buyer_cannot_create_property(self):
        """
        Ensure a buyer cannot create a new property.
        """
        self.client.force_authenticate(user=self.buyer)
        url = reverse('property-list')
        data = {
            'price': 100000.00,
            'location': 'Test Location',
            'description': 'A test property',
            'property_type': 'RESIDENTIAL'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch('RealEstateBackend.blockchain.update_inspection_status_on_blockchain')
    def test_appraiser_can_update_inspection_status(self, mock_update_inspection_status):
        """
        Ensure an appraiser can update the inspection status of a property.
        """
        mock_update_inspection_status.return_value = "0xtransactionhash456"
        # Create a property first
        self.client.force_authenticate(user=self.seller)
        property = Property.objects.create(seller=self.seller, price=100000.00, location='Test', description='Test', property_type='RESIDENTIAL')

        # Now, authenticate as appraiser and update inspection status
        self.client.force_authenticate(user=self.appraiser)
        url = reverse('property-update-inspection-status', kwargs={'pk': property.id})
        data = {'is_inspection_passed': True}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        property.refresh_from_db()
        self.assertTrue(property.is_inspection_passed)
        mock_update_inspection_status.assert_called_once()

    @patch('RealEstateBackend.blockchain.update_inspection_status_on_blockchain')
    def test_inspector_can_update_inspection_status(self, mock_update_inspection_status):
        """
        Ensure an inspector can update the inspection status of a property.
        """
        mock_update_inspection_status.return_value = "0xtransactionhash789"
        # Create a property first
        self.client.force_authenticate(user=self.seller)
        property = Property.objects.create(seller=self.seller, price=100000.00, location='Test', description='Test', property_type='RESIDENTIAL')

        # Now, authenticate as inspector and update inspection status
        self.client.force_authenticate(user=self.inspector)
        url = reverse('property-update-inspection-status', kwargs={'pk': property.id})
        data = {'is_inspection_passed': True}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        property.refresh_from_db()
        self.assertTrue(property.is_inspection_passed)
        mock_update_inspection_status.assert_called_once()

class OfferTests(APITestCase):
    def setUp(self):
        self.seller = CustomUser.objects.create_user(username='seller', password='password', user_type='seller')
        UserProfile.objects.create(user=self.seller, eth_address="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")

        self.buyer = CustomUser.objects.create_user(username='buyer', password='password', user_type='buyer')
        UserProfile.objects.create(user=self.buyer, eth_address="0x59c6995e998f97a5a004496c17f0ab241a74142305fd218621064954ee166979")

        self.property = Property.objects.create(seller=self.seller, price=100000.00, location='Test', description='Test', property_type='RESIDENTIAL')

    @patch('RealEstateBackend.blockchain.submit_offer_on_blockchain')
    def test_buyer_can_make_offer(self, mock_submit_offer):
        """
        Ensure a buyer can make an offer on a property.
        """
        mock_submit_offer.return_value = "0xtransactionhashabc"
        self.client.force_authenticate(user=self.buyer)
        url = reverse('offer-list')
        data = {
            'property': self.property.id,
            'amount': 90000.00,
            'expires_at': '2025-12-31T23:59:59Z'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mock_submit_offer.assert_called_once()

    @patch('RealEstateBackend.blockchain.accept_offer_on_blockchain')
    @patch('RealEstateBackend.blockchain.submit_offer_on_blockchain')
    def test_seller_can_accept_offer(self, mock_submit_offer, mock_accept_offer):
        """
        Ensure a seller can accept an offer.
        """
        mock_submit_offer.return_value = "0xtransactionhashdef"
        mock_accept_offer.return_value = "0xtransactionhashghi"

        # First, the buyer makes an offer
        self.client.force_authenticate(user=self.buyer)
        offer_url = reverse('offer-list')
        offer_data = {
            'property': self.property.id,
            'amount': 90000.00,
            'expires_at': '2025-12-31T23:59:59Z'
        }
        response = self.client.post(offer_url, offer_data, format='json')
        offer_id = response.data['id']

        # Now, the seller accepts the offer
        self.client.force_authenticate(user=self.seller)
        accept_url = reverse('offer-accept', kwargs={'pk': offer_id})
        response = self.client.post(accept_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.property.refresh_from_db()
        self.assertTrue(self.property.is_sold)
        self.assertEqual(self.property.buyer, self.buyer)
        mock_accept_offer.assert_called_once()

    @patch('RealEstateBackend.blockchain.submit_offer_on_blockchain')
    def test_seller_can_reject_offer(self, mock_submit_offer):
        """
        Ensure a seller can reject an offer.
        """
        mock_submit_offer.return_value = "0xtransactionhashjkl"
        # First, the buyer makes an offer
        self.client.force_authenticate(user=self.buyer)
        offer_url = reverse('offer-list')
        offer_data = {
            'property': self.property.id,
            'amount': 90000.00,
            'expires_at': '2025-12-31T23:59:59Z'
        }
        response = self.client.post(offer_url, offer_data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Offer Creation Failed for Reject Test: {response.data}")
        print(f"Offer Creation Response Data: {response.data}") # Added print statement
        offer_id = response.data['id']

        # Now, the seller rejects the offer
        self.client.force_authenticate(user=self.seller)
        reject_url = reverse('offer-reject', kwargs={'pk': offer_id})
        response = self.client.post(reject_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        offer = Offer.objects.get(id=offer_id)
        self.assertFalse(offer.is_active)