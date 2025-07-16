
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, OfferViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r'properties', PropertyViewSet, basename='property')
router.register(r'offers', OfferViewSet, basename='offer')
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('', include(router.urls)),
]
