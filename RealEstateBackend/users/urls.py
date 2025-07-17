
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoginView, UserDetailView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('users/me/', UserDetailView.as_view(), name='user-detail'),
    path('', include(router.urls)),
]
