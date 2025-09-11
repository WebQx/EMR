# WebQX Django Authentication URLs
# Secure routing for global healthcare platform

from django.urls import path, include
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from authentication.views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    mfa_setup,
    verify_mfa,
    user_profile,
    change_password,
    security_dashboard,
    revoke_session,
    password_reset_request,
    health_check,
)

# API Router
router = DefaultRouter()

# Authentication URLs
auth_patterns = [
    # JWT Token endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User management
    path('register/', UserRegistrationView.as_view(), name='user_register'),
    path('profile/', user_profile, name='user_profile'),
    path('change-password/', change_password, name='change_password'),
    
    # Multi-factor authentication
    path('mfa/setup/', mfa_setup, name='mfa_setup'),
    path('mfa/verify/', verify_mfa, name='mfa_verify'),
    
    # Security management
    path('security/dashboard/', security_dashboard, name='security_dashboard'),
    path('security/revoke-session/', revoke_session, name='revoke_session'),
    
    # Password reset
    path('password-reset/', password_reset_request, name='password_reset_request'),
    
    # Health check
    path('health/', health_check, name='health_check'),
]

# Main URL patterns
urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/v1/auth/', include(auth_patterns)),
    path('api/v1/', include(router.urls)),
    
    # Django Allauth (Social authentication)
    path('accounts/', include('allauth.urls')),
    
    # Django OTP (MFA)
    path('otp/', include('django_otp.urls')),
    
    # Health check at root
    path('health/', health_check, name='health_check_root'),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Admin site customization
admin.site.site_header = 'WebQX Healthcare Administration'
admin.site.site_title = 'WebQX Admin Portal'
admin.site.index_title = 'Welcome to WebQX Healthcare Administration'
