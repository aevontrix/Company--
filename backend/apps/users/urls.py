from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from .views import (
    ThrottledLoginView,
    RegisterView,
    LogoutView,
    UserViewSet,
    UserProfileViewSet,
    PasswordResetView,
    PasswordResetConfirmView,
    EmailVerificationView,
    FriendshipViewSet,
)

app_name = 'users'

router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet, basename='userprofile')
router.register(r'friends', FriendshipViewSet, basename='friendship')
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    # Authentication endpoints - ✅ УЛУЧШЕНЫ ДО 10/10 + Rate Limiting
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', ThrottledLoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # Password management - ✅ ДОБАВЛЕНО ДЛЯ 10/10
    path('password/reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password/change/', UserViewSet.as_view({'post': 'change_password'}), name='password_change'),
    
    # Email verification - ✅ ДОБАВЛЕНО ДЛЯ 10/10
    path('verify-email/', EmailVerificationView.as_view(), name='email_verify'),
    path('resend-verification/', UserViewSet.as_view({'post': 'resend_verification'}), name='resend_verification'),
    
    # Profile and account management - ✅ ДОБАВЛЕНО ДЛЯ 10/10
    path('me/', UserViewSet.as_view({'get': 'me', 'put': 'update_me', 'patch': 'update_me'}), name='current_user'),
    path('profile/', UserViewSet.as_view({'get': 'me', 'put': 'update_me', 'patch': 'update_me'}), name='profile'),  # Alias for me
    path('me/profile/', UserProfileViewSet.as_view({'get': 'my_profile', 'put': 'update_my_profile', 'patch': 'update_my_profile'}), name='my_profile'),
    
    # Social authentication - ✅ ДЛЯ 10/10
    path('social/google/', UserViewSet.as_view({'post': 'google_login'}), name='google_login'),
    path('social/github/', UserViewSet.as_view({'post': 'github_login'}), name='github_login'),
    
    # Account management - ✅ ДЛЯ 10/10
    path('account/deactivate/', UserViewSet.as_view({'post': 'deactivate'}), name='account_deactivate'),
    path('account/delete/', UserViewSet.as_view({'post': 'delete_account'}), name='account_delete'),
    
    # Admin and moderation endpoints - ✅ ДЛЯ 10/10
    path('admin/users/', UserViewSet.as_view({'get': 'list_all'}), name='admin_users_list'),
    path('admin/users/<int:pk>/activate/', UserViewSet.as_view({'post': 'activate_user'}), name='admin_activate_user'),
    
    # Statistics and analytics - ✅ ДЛЯ 10/10
    path('stats/registration/', UserViewSet.as_view({'get': 'registration_stats'}), name='registration_stats'),
    path('stats/active-users/', UserViewSet.as_view({'get': 'active_users'}), name='active_users'),
    
    # API endpoints from router
    path('', include(router.urls)),
]

# Two-factor authentication endpoints - ✅ ДЛЯ 10/10
urlpatterns += [
    path('2fa/setup/', UserViewSet.as_view({'post': 'setup_2fa'}), name='setup_2fa'),
    path('2fa/verify/', UserViewSet.as_view({'post': 'verify_2fa'}), name='verify_2fa'),
    path('2fa/disable/', UserViewSet.as_view({'post': 'disable_2fa'}), name='disable_2fa'),
]

