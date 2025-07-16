
---
### Workflow for the Real Estate Backend

The backend manages a real estate platform with three main user types: sellers, buyers, and admins. Below is the workflow, broken into key processes, followed by textual diagram descriptions.

#### Key Processes

1. **User Registration and Authentication**
   - Users (sellers, buyers, admins) register and log in to access the system.
   - After login, users receive an authentication token for subsequent actions.

2. **Property Management**
   - **Sellers**: List properties with details like address, price, and images.
   - **Buyers**: View and search available properties.

3. **Offer Management**
   - **Buyers**: Make offers on properties they’re interested in.
   - **Sellers**: View offers on their properties and accept or reject them.
   - When an offer is accepted, the property is marked as sold.

4. **Admin Functions**
   - Admins oversee the system, managing users and properties.

#### Detailed Workflow

- **User Registration**
  - User submits registration details (e.g., username, password).
  - System validates and stores the user in the database.
  - User logs in and receives a token.

- **Property Listing (Seller)**
  - Seller logs in with token.
  - Seller submits property details via a form.
  - System validates the data and saves the property to the database.
  - Seller is notified of success.

- **Property Viewing (Buyer)**
  - Buyer logs in with token.
  - Buyer requests a list of properties or details of a specific property.
  - System retrieves and returns the data.

- **Making an Offer (Buyer)**
  - Buyer selects a property and submits an offer.
  - System validates and saves the offer.
  - Seller is notified.

- **Managing Offers (Seller)**
  - Seller views offers for their property.
  - Seller accepts an offer.
  - System updates the offer status to "accepted" and the property status to "sold".

- **Admin Oversight**
  - Admin logs in with token.
  - Admin views and manages users or properties as needed.

#### Textual Diagram Representations

1. **Flowchart**
   ```
   +----------------+       +----------------+       +----------------+
   |   Register     | ----> |     Login      | ----> |   List Property  |
   +----------------+       +----------------+       +----------------+
                                                               |
                                                               v
                                                       +----------------+
                                                       |  View Properties |
                                                       +----------------+
                                                               |
                                                               v
                                                       +----------------+
                                                       |   Make Offer    |
                                                       +----------------+
                                                               |
                                                               v
                                                       +----------------+
                                                       |  View Offers    |
                                                       +----------------+
                                                               |
                                                               v
                                                       +----------------+
                                                       |  Accept Offer   |
                                                       +----------------+
   ```
2. **Sequence Diagram**
    A more organized view of the interactions between different user roles and the system.

    **Participants:**
    - **User**: Seller, Buyer, or Admin
    - **System**: The backend application
    - **Database**: Data storage

    **User Registration and Login (Common for all roles)**
    ```
    User                System              Database
     |                   |                   |
     |---Register------->|                   |
     |                   |---Validate &----->|
     |                   |   Create User     |
     |                   |<------------------|
     |<--Success---------|                   |
     |                   |                   |
     |---Login---------->|                   |
     |                   |---Authenticate--->|
     |                   |<------------------|
     |<--Auth Token------|                   |
     |                   |                   |
    ```

    **Seller Flow**
    ```
    Seller              System              Database
     |                   |                   |
     |---List Property-->|                   |
     | (with Token)      |---Validate &----->|
     |                   |   Save Property   |
     |                   |<------------------|
     |<--Success---------|                   |
     |                   |                   |
     |---View Offers---->|                   |
     | (for a property)  |---Fetch Offers--->|
     |                   |<------------------|
     |<--Offer List------|                   |
     |                   |                   |
     |---Accept Offer--->|                   |
     |                   |---Update Status-->|
     |                   |   (Offer, Prop)   |
     |                   |<------------------|
     |<--Success---------|                   |
     |                   |                   |
    ```

    **Buyer Flow**
    ```
    Buyer               System              Database
     |                   |                   |
     |---View Properties>|                   |
     | (with Token)      |---Fetch Props---->|
     |                   |<------------------|
     |<--Property List---|                   |
     |                   |                   |
     |---Make Offer----->|                   |
     | (with Token)      |---Validate &----->|
     |                   |   Save Offer      |
     |                   |<------------------|
     |<--Success---------|                   |
     | (Seller Notified) |                   |
     |                   |                   |
    ```

    **Admin Flow**
    ```
    Admin               System              Database
     |                   |                   |
     |---Manage Users--->|                   |
     | (with Token)      |---Fetch Users---->|
     |                   |<------------------|
     |<--User List-------|                   |
     |                   |                   |
    ```

---

### Django Backend Implementation

Based on the workflow, here’s how the Django backend can be structured:

#### 1. Project Setup
- Create a Django project and app (e.g., `real_estate`).
- Install dependencies: `djangorestframework`, `djangorestframework-jwt` (or similar for authentication).

#### 2. Models
Define the database structure:

```python
from django.db import models
from django.contrib.auth.models import User

class Property(models.Model):
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties')
    address = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField()
    images = models.JSONField(default=list)  # Store image URLs as a list
    status = models.CharField(max_length=20, default='listed', choices=[
        ('listed', 'Listed'), ('sold', 'Sold')
    ])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.address} - {self.status}"

class Offer(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='offers')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='offers')
    offer_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')
    ])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Offer {self.offer_amount} on {self.property.address}"
```

#### 3. Serializers
Convert model instances to JSON:

```python
from rest_framework import serializers
from .models import Property, Offer
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'seller', 'address', 'price', 'description', 'images', 'status', 'created_at']
        read_only_fields = ['seller', 'status', 'created_at']

class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = ['id', 'property', 'buyer', 'offer_amount', 'status', 'created_at']
        read_only_fields = ['buyer', 'status', 'created_at']
```

#### 4. Views
Handle API logic:

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Property, Offer
from .serializers import UserSerializer, PropertySerializer, OfferSerializer
from django.contrib.auth.models import User

class UserRegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PropertyListView(APIView):
    def get(self, request):
        properties = Property.objects.filter(status='listed')
        serializer = PropertySerializer(properties, many=True)
        return Response(serializer.data)

    permission_classes = [IsAuthenticated]
    def post(self, request):
        data = request.data.copy()
        data['seller'] = request.user.id
        serializer = PropertySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PropertyDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        property = get_object_or_404(Property, pk=pk)
        serializer = PropertySerializer(property)
        return Response(serializer.data)

class OfferCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        data = request.data.copy()
        data['buyer'] = request.user.id
        serializer = OfferSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OfferListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, property_id):
        property = get_object_or_404(Property, pk=property_id)
        if property.seller != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        offers = Offer.objects.filter(property=property)
        serializer = OfferSerializer(offers, many=True)
        return Response(serializer.data)

class OfferAcceptView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, offer_id):
        offer = get_object_or_404(Offer, pk=offer_id)
        if offer.property.seller != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        if offer.status != 'pending':
            return Response({"error": "Offer already processed"}, status=status.HTTP_400_BAD_REQUEST)
        offer.status = 'accepted'
        offer.property.status = 'sold'
        offer.save()
        offer.property.save()
        return Response({"message": "Offer accepted"}, status=status.HTTP_200_OK)

class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class AdminPropertyListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        properties = Property.objects.all()
        serializer = PropertySerializer(properties, many=True)
        return Response(serializer.data)
```

#### 5. URLs
Map endpoints:

```python
from django.urls import path
from .views import (
    UserRegisterView, PropertyListView, PropertyDetailView,
    OfferCreateView, OfferListView, OfferAcceptView,
    AdminUserListView, AdminPropertyListView
)
from rest_framework_jwt.views import obtain_jwt_token

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='register'),
    path('login/', obtain_jwt_token, name='login'),
    path('properties/', PropertyListView.as_view(), name='property-list'),
    path('properties/<int:pk>/', PropertyDetailView.as_view(), name='property-detail'),
    path('offers/', OfferCreateView.as_view(), name='offer-create'),
    path('properties/<int:property_id>/offers/', OfferListView.as_view(), name='offer-list'),
    path('offers/<int:offer_id>/accept/', OfferAcceptView.as_view(), name='offer-accept'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/properties/', AdminPropertyListView.as_view(), name='admin-properties'),
]
```

#### 6. Settings
Update `settings.py`:
- Add `'rest_framework'` and `'real_estate'` to `INSTALLED_APPS`.
- Configure JWT authentication in `REST_FRAMEWORK` settings.

-x