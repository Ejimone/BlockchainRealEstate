import os
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import Property, Offer, Transaction
from .serializers import PropertySerializer, OfferSerializer, TransactionSerializer, InspectionUpdateSerializer, OfferActionSerializer
from users.permissions import IsSeller, IsBuyer, IsAppraiser, IsInspector
from web3.exceptions import TransactionNotFound, ContractLogicError, TimeExhausted

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated, IsSeller | permissions.IsAdminUser]
        elif self.action == 'update_inspection_status':
            self.permission_classes = [IsAuthenticated, IsAppraiser | IsInspector | permissions.IsAdminUser]
        elif self.action == 'complete_transaction':
            self.permission_classes = [IsAuthenticated, IsSeller | IsBuyer | permissions.IsAdminUser]
        return super().get_permissions()

    def perform_create(self, serializer):
        seller_private_key = os.environ.get('SELLER_PRIVATE_KEY')

        agent_address = self.request.user.userprofile.eth_address if hasattr(self.request.user, 'userprofile') and self.request.user.userprofile.eth_address else "0x0000000000000000000000000000000000000000"

        price = serializer.validated_data['price']
        location = serializer.validated_data['location']
        property_type = serializer.validated_data['property_type']
        area = serializer.validated_data.get('area', 0)
        bedrooms = serializer.validated_data.get('bedrooms', 0)
        bathrooms = serializer.validated_data.get('bathrooms', 0)
        agent_commission = serializer.validated_data.get('agent_commission', 0)

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
        serializer.save(seller=self.request.user, transaction_hash=tx_hash)

    @action(detail=True, methods=['patch'])
    def update_inspection_status(self, request, pk=None):
        property = self.get_object()
        serializer = InspectionUpdateSerializer(property, data=request.data, partial=True)
        if serializer.is_valid():
            appraiser_private_key = os.environ.get('APPRAISER_PRIVATE_KEY')

            is_passed = serializer.validated_data.get('is_inspection_passed')

            try:
                from RealEstateBackend.blockchain import update_inspection_status_on_blockchain
                tx_hash = update_inspection_status_on_blockchain(
                    appraiser_private_key,
                    property.id,
                    is_passed
                )
                serializer.save(transaction_hash=tx_hash)
                return Response(serializer.data)
            except ContractLogicError as e:
                raise serializers.ValidationError(f"Blockchain contract error: {e.args[0]}")
            except TransactionNotFound:
                raise serializers.ValidationError("Blockchain transaction not found. It might have failed or is still pending.")
            except TimeExhausted:
                raise serializers.ValidationError("Blockchain transaction timed out. Please try again.")
            except Exception as e:
                raise serializers.ValidationError(f"An unexpected blockchain error occurred: {e}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete_transaction(self, request, pk=None):
        property = self.get_object()

        signer_private_key = "" # Placeholder
        if property.seller == request.user:
            signer_private_key = os.environ.get('SELLER_PRIVATE_KEY') # Seller's private key
        elif property.buyer == request.user:
            signer_private_key = os.environ.get('BUYER_PRIVATE_KEY') # Buyer's private key
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
            property.is_listed = False
            property.transaction_hash = tx_hash
            property.save()

            Transaction.objects.create(
                property=property,
                seller=property.seller,
                buyer=property.buyer,
                price=property.offer_amount,
                transaction_hash=tx_hash
            )

            return Response({'status': 'transaction completed', 'transaction_hash': tx_hash})
        except ContractLogicError as e:
            return Response({'error': f"Blockchain contract error: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
        except TransactionNotFound:
            return Response({'error': "Blockchain transaction not found. It might have failed or is still pending."}, status=status.HTTP_400_BAD_REQUEST)
        except TimeExhausted:
            return Response({'error': "Blockchain transaction timed out. Please try again."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f"An unexpected blockchain error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        buyer_private_key = os.environ.get('BUYER_PRIVATE_KEY')

        property_id = serializer.validated_data['property'].id
        amount = serializer.validated_data['amount']
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
            serializer.save(buyer=self.request.user, transaction_hash=tx_hash)
        except ContractLogicError as e:
            raise serializers.ValidationError(f"Blockchain contract error: {e.args[0]}")
        except TransactionNotFound:
            raise serializers.ValidationError("Blockchain transaction not found. It might have failed or is still pending.")
        except TimeExhausted:
            raise serializers.ValidationError("Blockchain transaction timed out. Please try again.")
        except Exception as e:
            raise serializers.ValidationError(f"An unexpected blockchain error occurred: {e}")

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        offer = self.get_object()
        property = offer.property
        if property.seller != request.user:
            return Response({'error': 'You are not the seller of this property.'}, status=status.HTTP_403_FORBIDDEN)

        seller_private_key = os.environ.get('SELLER_PRIVATE_KEY')

        try:
            from RealEstateBackend.blockchain import accept_offer_on_blockchain
            tx_hash = accept_offer_on_blockchain(
                seller_private_key,
                property.id,
                offer.buyer.userprofile.eth_address
            )

            offer.is_active = False
            offer.transaction_hash = tx_hash
            offer.save()

            property.is_sold = True
            property.buyer = offer.buyer
            property.save()

            for other_offer in property.offers.filter(is_active=True):
                other_offer.is_active = False
                other_offer.save()

            return Response({'status': 'offer accepted', 'transaction_hash': tx_hash})
        except ContractLogicError as e:
            return Response({'error': f"Blockchain contract error: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
        except TransactionNotFound:
            return Response({'error': "Blockchain transaction not found. It might have failed or is still pending."}, status=status.HTTP_400_BAD_REQUEST)
        except TimeExhausted:
            return Response({'error': "Blockchain transaction timed out. Please try again."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f"An unexpected blockchain error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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