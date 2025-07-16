from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import Property, Offer, Transaction
from .serializers import PropertySerializer, OfferSerializer, TransactionSerializer, InspectionUpdateSerializer, OfferActionSerializer
from users.permissions import IsSeller, IsBuyer, IsAppraiser, IsInspector

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated, IsSeller]
        elif self.action == 'update_inspection_status':
            self.permission_classes = [IsAuthenticated, IsAppraiser | IsInspector]
        return super().get_permissions()

    def perform_create(self, serializer):
        # Placeholder for seller's private key. In a real application, this would be managed securely.
        # For Ganache, you can get private keys from the accounts tab.
        # Example: Replace with an actual private key from your Ganache setup.
        # For now, using a dummy private key for demonstration. This will fail if not a valid key.
        # You should replace this with the private key of the seller's Ethereum account.
        # For testing, you can use one of the private keys provided by Ganache.
        seller_private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" # Example private key from Ganache

        # Assuming agent address is the seller's address for simplicity in this initial integration.
        # In a real application, this would be determined by the frontend or a separate agent management.
        agent_address = self.request.user.userprofile.address if hasattr(self.request.user, 'userprofile') and self.request.user.userprofile.address else "0x0000000000000000000000000000000000000000" # Placeholder

        # Extract data from serializer for blockchain interaction
        price = serializer.validated_data['price']
        location = serializer.validated_data['location']
        property_type = serializer.validated_data['property_type']
        area = serializer.validated_data.get('area', 0)
        bedrooms = serializer.validated_data.get('bedrooms', 0)
        bathrooms = serializer.validated_data.get('bathrooms', 0)
        agent_commission = serializer.validated_data.get('agent_commission', 0)

        try:
            from RealEstateBackend.blockchain import list_property_on_blockchain
            tx_hash = list_property_on_blockchain(
                seller_private_key,
                float(price),
                location,
                property_type,
                area,
                bedrooms,
                bathrooms,
                agent_address,
                int(agent_commission)
            )
            serializer.save(seller=self.request.user, transaction_hash=tx_hash) # Save transaction hash to Django model
        except Exception as e:
            # Handle blockchain interaction errors
            raise serializers.ValidationError(f"Blockchain interaction failed: {e}")

    @action(detail=True, methods=['patch'])
    def update_inspection_status(self, request, pk=None):
        property = self.get_object()
        serializer = InspectionUpdateSerializer(property, data=request.data, partial=True)
        if serializer.is_valid():
            # Placeholder for appraiser's private key.
            appraiser_private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" # Example private key from Ganache

            is_passed = serializer.validated_data.get('is_inspection_passed')

            try:
                from RealEstateBackend.blockchain import update_inspection_status_on_blockchain
                tx_hash = update_inspection_status_on_blockchain(
                    appraiser_private_key,
                    property.id,
                    is_passed
                )
                serializer.save(transaction_hash=tx_hash) # Save transaction hash to Django model
                return Response(serializer.data)
            except Exception as e:
                raise serializers.ValidationError(f"Blockchain interaction failed: {e}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@action(detail=True, methods=['patch'])
    def update_inspection_status(self, request, pk=None):
        property = self.get_object()
        serializer = InspectionUpdateSerializer(property, data=request.data, partial=True)
        if serializer.is_valid():
            # Placeholder for appraiser's private key.
            appraiser_private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" # Example private key from Ganache

            is_passed = serializer.validated_data.get('is_inspection_passed')

            try:
                from RealEstateBackend.blockchain import update_inspection_status_on_blockchain
                tx_hash = update_inspection_status_on_blockchain(
                    appraiser_private_key,
                    property.id,
                    is_passed
                )
                serializer.save(transaction_hash=tx_hash) # Save transaction hash to Django model
                return Response(serializer.data)
            except Exception as e:
                raise serializers.ValidationError(f"Blockchain interaction failed: {e}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete_transaction(self, request, pk=None):
        property = self.get_object()

        # Determine who is signing the transaction (seller or buyer)
        signer_private_key = "" # Placeholder
        if property.seller == request.user:
            signer_private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" # Seller's private key
        elif property.buyer == request.user:
            signer_private_key = "0x59c6995e998f97a5a004496c17f0ab241a74142305fd218621064954ee166979" # Buyer's private key
        else:
            return Response({'error': 'You are not authorized to complete this transaction.'}, status=status.HTTP_403_FORBIDDEN)

        if not property.is_inspection_passed:
            return Response({'error': 'Inspection not passed.'}, status=status.HTTP_400_BAD_REQUEST)
        if not property.financing_approved:
            return Response({'error': 'Financing not approved.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from RealEstateBackend.blockchain import complete_transaction_on_blockchain
            tx_hash = complete_transaction_on_blockchain(
                signer_private_key,
                property.id
            )

            property.is_sold = True
            property.is_listed = False # Assuming property is delisted after sale
            property.transaction_hash = tx_hash # Store blockchain transaction hash
            property.save()

            # Create a Transaction record in Django
            Transaction.objects.create(
                property=property,
                seller=property.seller,
                buyer=property.buyer,
                price=property.offer_amount, # Assuming offer_amount is the final sale price
                transaction_hash=tx_hash
            )

            return Response({'status': 'transaction completed', 'transaction_hash': tx_hash})
        except Exception as e:
            raise serializers.ValidationError(f"Blockchain interaction failed: {e}")

class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [IsAuthenticated, IsBuyer]
        elif self.action in ['accept', 'reject']:
            self.permission_classes = [IsAuthenticated, IsSeller]
        return super().get_permissions()

    def perform_create(self, serializer):
        # Placeholder for buyer's private key. In a real application, this would be managed securely.
        # For Ganache, you can get private keys from the accounts tab.
        # Example: Replace with an actual private key from your Ganache setup.
        # For now, using a dummy private key for demonstration. This will fail if not a valid key.
        # You should replace this with the private key of the buyer's Ethereum account.
        # For testing, you can use one of the private keys provided by Ganache.
        buyer_private_key = "0x59c6995e998f97a5a004496c17f0ab241a74142305fd218621064954ee166979" # Example private key from Ganache

        # Extract data from serializer for blockchain interaction
        property_id = serializer.validated_data['property'].id # Assuming property.id maps to propertyId on blockchain
        amount = serializer.validated_data['amount']
        # Calculate expires_in_seconds from expires_at. Assuming expires_at is a datetime object.
        # You might need to adjust this based on how expires_at is sent from the frontend.
        expires_at = serializer.validated_data['expires_at']
        import datetime
        expires_in_seconds = int((expires_at - datetime.datetime.now(datetime.timezone.utc)).total_seconds())

        try:
            from RealEstateBackend.blockchain import submit_offer_on_blockchain
            tx_hash = submit_offer_on_blockchain(
                buyer_private_key,
                property_id,
                float(amount),
                expires_in_seconds
            )
            serializer.save(buyer=self.request.user, transaction_hash=tx_hash) # Save transaction hash to Django model
        except Exception as e:
            # Handle blockchain interaction errors
            raise serializers.ValidationError(f"Blockchain interaction failed: {e}")

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        offer = self.get_object()
        property = offer.property
        if property.seller != request.user:
            return Response({'error': 'You are not the seller of this property.'}, status=status.HTTP_403_FORBIDDEN)

        # Placeholder for seller's private key.
        seller_private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" # Example private key from Ganache

        try:
            from RealEstateBackend.blockchain import accept_offer_on_blockchain
            tx_hash = accept_offer_on_blockchain(
                seller_private_key,
                property.id,
                offer.buyer.userprofile.eth_address # Assuming buyer's eth_address is stored in UserProfile
            )

            # Accept the offer
            offer.is_active = False
            offer.transaction_hash = tx_hash # Store blockchain transaction hash
            offer.save()

            # Update the property
            property.is_sold = True
            property.buyer = offer.buyer
            property.save()

            # Reject all other active offers for this property
            for other_offer in property.offers.filter(is_active=True):
                other_offer.is_active = False
                other_offer.save()

            return Response({'status': 'offer accepted', 'transaction_hash': tx_hash})
        except Exception as e:
            raise serializers.ValidationError(f"Blockchain interaction failed: {e}")

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        offer = self.get_object()
        property = offer.property
        if property.seller != request.user:
            return Response({'error': 'You are not the seller of this property.'}, status=status.HTTP_403_FORBIDDEN)

        offer.is_active = False
        offer.save()

        return Response({'status': 'offer rejected'})

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
