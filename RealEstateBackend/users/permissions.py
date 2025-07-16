
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user

class IsSeller(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type == 'seller'

class IsBuyer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type == 'buyer'

class IsAppraiser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type == 'appraiser'

class IsInspector(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type == 'inspector'
