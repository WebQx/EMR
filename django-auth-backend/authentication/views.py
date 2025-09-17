# WebQX Authentication Views
# Secure login endpoints for global healthcare platform

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.generic import View
from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache
from django.contrib.gis.geoip2 import GeoIP2
from django.contrib.sessions.models import Session
from django.db import transaction
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.middleware.csrf import get_token

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
import os
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.backends import TokenBackend

from django_otp import match_token
from django_otp.models import Device
import pyotp
import qrcode
import io
import base64
import json
import logging
import hashlib
import secrets
from datetime import timedelta
from user_agents import parse

from .models import WebQXUser, UserLoginHistory, UserSecurityEvent, UserSession
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserProfileSerializer,
    PasswordChangeSerializer,
    PasswordResetSerializer,
    MFASetupSerializer
)
from .throttling import LoginRateThrottle, RegistrationRateThrottle
from .utils import get_client_ip, get_device_info, detect_suspicious_activity

logger = logging.getLogger('authentication')
security_logger = logging.getLogger('security_monitoring')


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def token_introspect(request):
    """Simple JWT token introspection endpoint (Phase 1).
    Accepts JSON: { "token": "<JWT>" }
    Returns active=false if invalid/expired.
    NOTE: For HS256 shared secret only (matches SIMPLE_JWT config). Upgrade to RS256 + JWKS in Phase 2.
    """
    token = request.data.get('token') or request.POST.get('token')
    if not token:
        return Response({'active': False, 'error': 'missing_token'}, status=400)
    try:
        backend = TokenBackend(algorithm='HS256', signing_key=settings.SECRET_KEY)
        payload = backend.decode(token, verify=True)
        # Map to RFC 7662 style fields
        response = {
            'active': True,
            'iss': payload.get('iss'),
            'aud': payload.get('aud'),
            'exp': payload.get('exp'),
            'iat': payload.get('iat'),
            'sub': payload.get('user_id') or payload.get('sub'),
            'scope': ' '.join(payload.get('scopes', [])) if isinstance(payload.get('scopes'), (list, tuple)) else payload.get('scope', ''),
            'role': payload.get('role'),
            'email': payload.get('email'),
        }
        return Response(response)
    except Exception as e:
        logger.debug(f'Token introspection failed: {e}')
        return Response({'active': False}, status=200)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def jwks_view(request):
    """Return JSON Web Key Set for RS256 public key distribution."""
    pub_path = os.getenv('JWT_PUBLIC_KEY_PATH', str(settings.BASE_DIR / 'keys' / 'public.pem'))
    if not os.path.exists(pub_path):
        return Response({'keys': []})
    try:
        with open(pub_path, 'r') as f:
            pem = f.read()
        # Extract modulus & exponent for RSA public key (simplified parsing)
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend
        key = serialization.load_pem_public_key(pem.encode(), backend=default_backend())
        numbers = key.public_numbers()
        import base64
        def b64u(data: bytes) -> str:
            return base64.urlsafe_b64encode(data).decode().rstrip('=')
        n = b64u(numbers.n.to_bytes((numbers.n.bit_length() + 7)//8, 'big'))
        e = b64u(numbers.e.to_bytes((numbers.e.bit_length() + 7)//8, 'big'))
        jwk = {
            'kty': 'RSA',
            'alg': 'RS256',
            'use': 'sig',
            'n': n,
            'e': e,
            'kid': 'webqx-rs256-1'
        }
        return Response({'keys': [jwk]})
    except Exception as ex:
        logger.error(f'JWKS generation error: {ex}')
        return Response({'keys': []})


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view with enhanced security"""
    throttle_classes = [LoginRateThrottle]

    class Serializer(TokenObtainPairSerializer):
        @classmethod
        def get_token(cls, user):
            token = super().get_token(user)
            # Map application roles (user_type) to simplified RBAC roles used by microservices
            role_map = {
                'PATIENT': 'patient',
                'PROVIDER': 'provider',
                'ADMIN': 'admin',
                'STAFF': 'staff',
                'RESEARCHER': 'researcher',
                'PHARMACY': 'pharmacy'
            }
            token['role'] = role_map.get(getattr(user, 'user_type', ''), 'user')
            # Include specialties list if present in metadata
            specialties = []
            meta = getattr(user, 'metadata', {}) or {}
            if isinstance(meta, dict):
                raw_specs = meta.get('specialties') or meta.get('provider_specialties') or []
                if isinstance(raw_specs, (list, tuple)):
                    specialties = [s for s in raw_specs if isinstance(s, str)]
            if specialties:
                token['specialties'] = specialties
            # Basic identity claims
            token['email'] = user.email
            token['name'] = user.get_full_name()
            return token

    serializer_class = Serializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Log successful login
            user_email = request.data.get('email')
            try:
                user = WebQXUser.objects.get(email=user_email)
                self._log_login_success(request, user)
                self._update_user_session(request, user)
            except WebQXUser.DoesNotExist:
                pass
        else:
            # Log failed login
            self._log_login_failure(request)
        
        return response
    
    def _log_login_success(self, request, user):
        """Log successful login attempt"""
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Reset failed login attempts
        user.reset_failed_login()
        
        # Create login history record
        UserLoginHistory.objects.create(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            status='SUCCESS',
            session_id=request.session.session_key
        )
        
        # Check for suspicious activity
        if detect_suspicious_activity(user, ip_address, user_agent):
            UserSecurityEvent.objects.create(
                user=user,
                event_type='SUSPICIOUS_LOGIN',
                severity='HIGH',
                ip_address=ip_address,
                user_agent=user_agent,
                description=f'Suspicious login detected from {ip_address}'
            )
            security_logger.warning(f'Suspicious login for user {user.email} from {ip_address}')
        
        logger.info(f'Successful login for user {user.email} from {ip_address}')
    
    def _log_login_failure(self, request):
        """Log failed login attempt"""
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        email = request.data.get('email', 'unknown')
        
        # Try to get user and increment failed attempts
        try:
            user = WebQXUser.objects.get(email=email)
            user.increment_failed_login()
            
            UserLoginHistory.objects.create(
                user=user,
                ip_address=ip_address,
                user_agent=user_agent,
                status='FAILED',
                failure_reason='Invalid credentials'
            )
        except WebQXUser.DoesNotExist:
            # Log attempt even if user doesn't exist
            UserLoginHistory.objects.create(
                user=None,
                ip_address=ip_address,
                user_agent=user_agent,
                status='FAILED',
                failure_reason='User not found'
            )
        
        logger.warning(f'Failed login attempt for {email} from {ip_address}')
    
    def _update_user_session(self, request, user):
        """Update user session information"""
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        user.last_login_ip = ip_address
        user.last_login_device = user_agent
        user.update_last_activity()


class UserRegistrationView(APIView):
    """User registration endpoint with comprehensive validation"""
    throttle_classes = [RegistrationRateThrottle]
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    user = serializer.save()
                    
                    # Log registration event
                    ip_address = get_client_ip(request)
                    self._log_registration(user, ip_address, request)
                    
                    # Send verification email
                    self._send_verification_email(user, request)
                    
                    # Generate tokens
                    refresh = RefreshToken.for_user(user)
                    access_token = str(refresh.access_token)
                    
                    response_data = {
                        'success': True,
                        'message': 'Registration successful. Please check your email for verification.',
                        'user': {
                            'id': str(user.id),
                            'email': user.email,
                            'full_name': user.get_full_name(),
                            'user_type': user.user_type,
                            'verification_status': user.verification_status,
                            'email_verified': user.email_verified,
                        },
                        'tokens': {
                            'access': access_token,
                            'refresh': str(refresh),
                        }
                    }
                    
                    logger.info(f'New user registered: {user.email}')
                    return Response(response_data, status=status.HTTP_201_CREATED)
                    
            except Exception as e:
                logger.error(f'Registration error: {str(e)}')
                return Response({
                    'success': False,
                    'message': 'Registration failed. Please try again.',
                    'errors': {'non_field_errors': ['An unexpected error occurred.']}
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': False,
            'message': 'Registration failed. Please check your input.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def _log_registration(self, user, ip_address, request):
        """Log user registration event"""
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        UserSecurityEvent.objects.create(
            user=user,
            event_type='ACCOUNT_CREATED',
            severity='LOW',
            ip_address=ip_address,
            user_agent=user_agent,
            description=f'New user account created from {ip_address}'
        )
    
    def _send_verification_email(self, user, request):
        """Send email verification to new user"""
        try:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            verification_url = request.build_absolute_uri(
                reverse('verify_email', kwargs={'uidb64': uid, 'token': token})
            )
            
            context = {
                'user': user,
                'verification_url': verification_url,
                'site_name': 'WebQX Healthcare',
            }
            
            subject = 'Verify your WebQX Healthcare account'
            html_message = render_to_string('authentication/verification_email.html', context)
            plain_message = render_to_string('authentication/verification_email.txt', context)
            
            send_mail(
                subject=subject,
                message=plain_message,
                html_message=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            logger.info(f'Verification email sent to {user.email}')
            
        except Exception as e:
            logger.error(f'Failed to send verification email to {user.email}: {str(e)}')


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def mfa_setup(request):
    """Setup MFA for user account"""
    user = request.user
    
    if request.method == 'GET':
        # Generate QR code for TOTP setup
        if not user.mfa_enabled:
            secret = pyotp.random_base32()
            totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
                name=user.email,
                issuer_name="WebQX Healthcare"
            )
            
            # Generate QR code
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(totp_uri)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            qr_code_image = base64.b64encode(buffer.getvalue()).decode()
            
            # Store secret temporarily in cache
            cache.set(f'mfa_setup_{user.id}', secret, timeout=300)  # 5 minutes
            
            return Response({
                'qr_code': f'data:image/png;base64,{qr_code_image}',
                'secret': secret,
                'backup_tokens': [],
                'setup_complete': False
            })
        else:
            return Response({
                'message': 'MFA is already enabled',
                'setup_complete': True
            })
    
    elif request.method == 'POST':
        # Verify TOTP token and enable MFA
        token = request.data.get('token')
        secret = cache.get(f'mfa_setup_{user.id}')
        
        if not secret:
            return Response({
                'error': 'Setup session expired. Please start again.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        totp = pyotp.TOTP(secret)
        if totp.verify(token, valid_window=2):
            # Generate backup tokens
            backup_tokens = [secrets.token_hex(8) for _ in range(10)]
            hashed_backup_tokens = [hashlib.sha256(token.encode()).hexdigest() for token in backup_tokens]
            
            user.mfa_enabled = True
            user.backup_tokens = hashed_backup_tokens
            user.save()
            
            # Store TOTP device
            from django_otp.plugins.otp_totp.models import TOTPDevice
            device = TOTPDevice.objects.create(
                user=user,
                name='WebQX TOTP',
                key=secret,
                confirmed=True
            )
            
            # Log security event
            UserSecurityEvent.objects.create(
                user=user,
                event_type='MFA_ENABLED',
                severity='MEDIUM',
                description='Multi-factor authentication enabled'
            )
            
            # Clear setup cache
            cache.delete(f'mfa_setup_{user.id}')
            
            logger.info(f'MFA enabled for user {user.email}')
            
            return Response({
                'message': 'MFA setup complete',
                'backup_tokens': backup_tokens,  # Show once only
                'setup_complete': True
            })
        else:
            return Response({
                'error': 'Invalid token. Please try again.'
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_mfa(request):
    """Verify MFA token during login process"""
    user = request.user
    token = request.data.get('token')
    backup_token = request.data.get('backup_token')
    
    if backup_token:
        # Verify backup token
        hashed_backup = hashlib.sha256(backup_token.encode()).hexdigest()
        if hashed_backup in user.backup_tokens:
            # Remove used backup token
            user.backup_tokens.remove(hashed_backup)
            user.save()
            
            logger.info(f'Backup token used for user {user.email}')
            return Response({'success': True, 'message': 'MFA verified with backup token'})
        else:
            return Response({'error': 'Invalid backup token'}, status=status.HTTP_400_BAD_REQUEST)
    
    elif token:
        # Verify TOTP token
        device = match_token(user, token)
        if device:
            logger.info(f'MFA verified for user {user.email}')
            return Response({'success': True, 'message': 'MFA verified'})
        else:
            # Log failed MFA attempt
            UserLoginHistory.objects.create(
                user=user,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status='MFA_FAILED',
                failure_reason='Invalid MFA token'
            )
            return Response({'error': 'Invalid MFA token'}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """Get user profile information"""
    user = request.user
    serializer = UserProfileSerializer(user)
    
    # Include additional security information
    profile_data = serializer.data
    profile_data.update({
        'last_login': user.last_login,
        'profile_completed': user.is_profile_complete(),
        'mfa_enabled': user.mfa_enabled,
        'verification_status': user.verification_status,
        'active_sessions': user.sessions.filter(is_active=True).count(),
        'recent_login_locations': user.login_history.filter(
            status='SUCCESS'
        ).order_by('-timestamp')[:5].values_list('location', flat=True)
    })
    
    return Response(profile_data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password with security checks"""
    user = request.user
    serializer = PasswordChangeSerializer(data=request.data, context={'user': user})
    
    if serializer.is_valid():
        # Verify current password
        current_password = serializer.validated_data['current_password']
        if not user.check_password(current_password):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        new_password = serializer.validated_data['new_password']
        user.set_password(new_password)
        user.password_changed_at = timezone.now()
        user.save()
        
        # Log security event
        UserSecurityEvent.objects.create(
            user=user,
            event_type='PASSWORD_CHANGE',
            severity='MEDIUM',
            ip_address=get_client_ip(request),
            description='Password changed by user'
        )
        
        # Invalidate all existing sessions except current
        user.sessions.exclude(session_key=request.session.session_key).update(is_active=False)
        
        logger.info(f'Password changed for user {user.email}')
        
        return Response({'message': 'Password changed successfully'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def security_dashboard(request):
    """Get user security dashboard information"""
    user = request.user
    
    # Recent security events
    recent_events = user.security_events.order_by('-timestamp')[:10]
    
    # Active sessions
    active_sessions = user.sessions.filter(is_active=True)
    
    # Recent login history
    recent_logins = user.login_history.order_by('-timestamp')[:10]
    
    dashboard_data = {
        'account_security': {
            'mfa_enabled': user.mfa_enabled,
            'email_verified': user.email_verified,
            'phone_verified': user.phone_verified,
            'password_last_changed': user.password_changed_at,
            'account_created': user.created_at,
        },
        'active_sessions': [
            {
                'session_id': session.session_key[:8] + '...',
                'ip_address': session.ip_address,
                'device_type': session.device_type,
                'location': session.location,
                'last_activity': session.last_activity,
                'current': session.session_key == request.session.session_key
            }
            for session in active_sessions
        ],
        'recent_events': [
            {
                'event_type': event.event_type,
                'severity': event.severity,
                'timestamp': event.timestamp,
                'description': event.description,
                'ip_address': event.ip_address
            }
            for event in recent_events
        ],
        'recent_logins': [
            {
                'timestamp': login.timestamp,
                'ip_address': login.ip_address,
                'location': login.location,
                'status': login.status,
                'device_info': login.user_agent[:100] + '...' if len(login.user_agent) > 100 else login.user_agent
            }
            for login in recent_logins
        ]
    }
    
    return Response(dashboard_data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def revoke_session(request):
    """Revoke a specific user session"""
    user = request.user
    session_id = request.data.get('session_id')
    
    if not session_id:
        return Response({'error': 'Session ID required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        session = user.sessions.get(session_key=session_id, is_active=True)
        session.is_active = False
        session.save()
        
        # Also remove from Django sessions
        try:
            django_session = Session.objects.get(session_key=session_id)
            django_session.delete()
        except Session.DoesNotExist:
            pass
        
        logger.info(f'Session {session_id} revoked for user {user.email}')
        
        return Response({'message': 'Session revoked successfully'})
    
    except UserSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """Request password reset"""
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = WebQXUser.objects.get(email=email, is_active=True)
        
        # Generate reset token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Send reset email
        reset_url = request.build_absolute_uri(
            reverse('password_reset_confirm', kwargs={'uidb64': uid, 'token': token})
        )
        
        context = {
            'user': user,
            'reset_url': reset_url,
            'site_name': 'WebQX Healthcare',
        }
        
        subject = 'Reset your WebQX Healthcare password'
        html_message = render_to_string('authentication/password_reset_email.html', context)
        plain_message = render_to_string('authentication/password_reset_email.txt', context)
        
        send_mail(
            subject=subject,
            message=plain_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
        
        # Log security event
        UserSecurityEvent.objects.create(
            user=user,
            event_type='PASSWORD_RESET_REQUESTED',
            severity='MEDIUM',
            ip_address=get_client_ip(request),
            description='Password reset requested'
        )
        
        logger.info(f'Password reset requested for {email}')
        
    except WebQXUser.DoesNotExist:
        # Don't reveal if email exists
        pass
    
    return Response({'message': 'If the email address exists, a reset link has been sent.'})


# Health check endpoint
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """Health check endpoint for load balancers"""
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now(),
        'version': '1.0.0'
    })
