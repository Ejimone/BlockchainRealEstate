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

    @action(detail=True, methods=['patch'])
    def update_inspection_status(self, request, pk=None):
        property = self.get_object()
        serializer = InspectionUpdateSerializer(property, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        offer = self.get_object()
        property = offer.property
        if property.seller != request.user:
            return Response({'error': 'You are not the seller of this property.'}, status=status.HTTP_403_FORBIDDEN)

        # Accept the offer
        offer.is_active = False
        offer.save()

        # Update the property
        property.is_sold = True
        property.buyer = offer.buyer
        property.save()

        # Reject all other active offers for this property
        for other_offer in property.offers.filter(is_active=True):
            other_offer.is_active = False
            other_offer.save()

        return Response({'status': 'offer accepted'})

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
