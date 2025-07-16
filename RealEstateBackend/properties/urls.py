
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, OfferViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r'properties', PropertyViewSet)
router.register(r'offers', OfferViewSet)
router.register(r'transactions', TransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
