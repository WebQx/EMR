# WebQX Authentication Serializers
# Data validation and serialization for secure API endpoints

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.utils import timezone
from django.core.exceptions import ValidationError
import re
from datetime import date, timedelta

from .models import WebQXUser, UserLoginHistory, UserSecurityEvent


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with comprehensive validation"""
    
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    terms_accepted = serializers.BooleanField(required=True)
    privacy_policy_accepted = serializers.BooleanField(required=True)
    
    class Meta:
        model = WebQXUser
        fields = [
            'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'middle_name',
            'date_of_birth', 'phone_number',
            'user_type', 'country', 'language',
            'terms_accepted', 'privacy_policy_accepted',
            'hipaa_authorization', 'gdpr_consent'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'user_type': {'required': True},
        }
    
    def validate_email(self, value):
        """Validate email format and uniqueness"""
        if WebQXUser.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        # Additional email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value):
            raise serializers.ValidationError("Enter a valid email address.")
        
        return value.lower()
    
    def validate_phone_number(self, value):
        """Validate phone number format"""
        if value:
            # Remove any non-digit characters except +
            cleaned = re.sub(r'[^\d+]', '', value)
            
            # Basic international phone number validation
            if not re.match(r'^\+?[1-9]\d{7,14}$', cleaned):
                raise serializers.ValidationError(
                    "Enter a valid phone number in international format."
                )
            
            return cleaned
        return value
    
    def validate_date_of_birth(self, value):
        """Validate date of birth"""
        if value:
            today = date.today()
            age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
            
            if age < 13:
                raise serializers.ValidationError("You must be at least 13 years old to register.")
            
            if age > 120:
                raise serializers.ValidationError("Please enter a valid date of birth.")
            
            if value > today:
                raise serializers.ValidationError("Date of birth cannot be in the future.")
        
        return value
    
    def validate_user_type(self, value):
        """Validate user type"""
        allowed_registration_types = ['PATIENT', 'PROVIDER', 'PHARMACY']
        if value not in allowed_registration_types:
            raise serializers.ValidationError(
                f"Invalid user type. Allowed types: {', '.join(allowed_registration_types)}"
            )
        return value
    
    def validate_terms_accepted(self, value):
        """Ensure terms are accepted"""
        if not value:
            raise serializers.ValidationError("You must accept the terms and conditions.")
        return value
    
    def validate_privacy_policy_accepted(self, value):
        """Ensure privacy policy is accepted"""
        if not value:
            raise serializers.ValidationError("You must accept the privacy policy.")
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        # Password confirmation
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'Password confirmation does not match.'
            })
        
        # User type specific validations
        user_type = attrs.get('user_type')
        
        if user_type == 'PROVIDER':
            if not attrs.get('phone_number'):
                raise serializers.ValidationError({
                    'phone_number': 'Phone number is required for healthcare providers.'
                })
        
        if user_type == 'PATIENT':
            if not attrs.get('date_of_birth'):
                raise serializers.ValidationError({
                    'date_of_birth': 'Date of birth is required for patients.'
                })
            
            if not attrs.get('hipaa_authorization'):
                raise serializers.ValidationError({
                    'hipaa_authorization': 'HIPAA authorization is required for patients.'
                })
        
        return attrs
    
    def create(self, validated_data):
        """Create new user with validated data"""
        # Remove password confirmation from validated data
        validated_data.pop('password_confirm', None)
        
        # Extract password
        password = validated_data.pop('password')
        
        # Set consent timestamps
        if validated_data.get('terms_accepted'):
            validated_data['terms_accepted'] = True
        if validated_data.get('privacy_policy_accepted'):
            validated_data['privacy_policy_accepted'] = True
        if validated_data.get('hipaa_authorization'):
            validated_data['hipaa_authorization_date'] = timezone.now()
        if validated_data.get('gdpr_consent'):
            validated_data['gdpr_consent_date'] = timezone.now()
        
        # Create user
        user = WebQXUser.objects.create_user(
            password=password,
            **validated_data
        )
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    remember_me = serializers.BooleanField(default=False)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Check if user exists and is active
            try:
                user = WebQXUser.objects.get(email=email.lower())
                
                if not user.is_active:
                    raise serializers.ValidationError('This account has been deactivated.')
                
                if user.is_locked_out():
                    raise serializers.ValidationError(
                        f'Account is temporarily locked due to multiple failed login attempts. '
                        f'Try again after {user.lockout_until.strftime("%H:%M")}.'
                    )
                
                # Authenticate user
                user = authenticate(email=email.lower(), password=password)
                if not user:
                    raise serializers.ValidationError('Invalid email or password.')
                
                attrs['user'] = user
                
            except WebQXUser.DoesNotExist:
                raise serializers.ValidationError('Invalid email or password.')
        
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile information"""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    profile_complete = serializers.SerializerMethodField()
    
    class Meta:
        model = WebQXUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'middle_name',
            'full_name', 'date_of_birth', 'phone_number',
            'user_type', 'verification_status', 'country', 'language',
            'timezone', 'is_verified', 'email_verified', 'phone_verified',
            'mfa_enabled', 'profile_complete', 'onboarding_completed',
            'created_at', 'updated_at', 'last_activity'
        ]
        read_only_fields = [
            'id', 'email', 'user_type', 'verification_status',
            'is_verified', 'email_verified', 'phone_verified',
            'mfa_enabled', 'created_at', 'updated_at'
        ]
    
    def get_profile_complete(self, obj):
        """Check if user profile is complete"""
        return obj.is_profile_complete()
    
    def validate_phone_number(self, value):
        """Validate phone number if provided"""
        if value:
            cleaned = re.sub(r'[^\d+]', '', value)
            if not re.match(r'^\+?[1-9]\d{7,14}$', cleaned):
                raise serializers.ValidationError(
                    "Enter a valid phone number in international format."
                )
            return cleaned
        return value


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    
    current_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate password change data"""
        user = self.context.get('user')
        current_password = attrs.get('current_password')
        new_password = attrs.get('new_password')
        new_password_confirm = attrs.get('new_password_confirm')
        
        # Check if new passwords match
        if new_password != new_password_confirm:
            raise serializers.ValidationError({
                'new_password_confirm': 'New password confirmation does not match.'
            })
        
        # Check if new password is different from current
        if user and user.check_password(new_password):
            raise serializers.ValidationError({
                'new_password': 'New password must be different from the current password.'
            })
        
        return attrs


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset"""
    
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Validate email exists"""
        try:
            user = WebQXUser.objects.get(email=value.lower(), is_active=True)
            return value.lower()
        except WebQXUser.DoesNotExist:
            # Don't reveal if email doesn't exist for security
            return value.lower()


class MFASetupSerializer(serializers.Serializer):
    """Serializer for MFA setup"""
    
    token = serializers.CharField(max_length=6, min_length=6)
    
    def validate_token(self, value):
        """Validate MFA token format"""
        if not value.isdigit():
            raise serializers.ValidationError('Token must be 6 digits.')
        return value


class UserSecurityEventSerializer(serializers.ModelSerializer):
    """Serializer for security events"""
    
    class Meta:
        model = UserSecurityEvent
        fields = [
            'id', 'event_type', 'severity', 'timestamp',
            'ip_address', 'description', 'investigated'
        ]
        read_only_fields = ['id', 'timestamp']


class UserLoginHistorySerializer(serializers.ModelSerializer):
    """Serializer for login history"""
    
    class Meta:
        model = UserLoginHistory
        fields = [
            'timestamp', 'ip_address', 'location', 'status',
            'failure_reason', 'user_agent'
        ]
        read_only_fields = ['timestamp']


class UserSessionSerializer(serializers.Serializer):
    """Serializer for user sessions"""
    
    session_id = serializers.CharField(read_only=True)
    ip_address = serializers.IPAddressField(read_only=True)
    device_type = serializers.CharField(read_only=True)
    location = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    last_activity = serializers.DateTimeField(read_only=True)
    is_current = serializers.BooleanField(read_only=True)
