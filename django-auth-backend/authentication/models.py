# WebQX Custom User Model
# Enterprise-grade user management for global healthcare platform

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
from django.contrib.postgres.fields import JSONField
import uuid
from datetime import timedelta


class WebQXUserManager(BaseUserManager):
    """Custom user manager for WebQX healthcare platform"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password"""
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'ADMIN')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class WebQXUser(AbstractBaseUser, PermissionsMixin):
    """Custom user model for WebQX healthcare platform"""
    
    USER_TYPE_CHOICES = [
        ('PATIENT', 'Patient'),
        ('PROVIDER', 'Healthcare Provider'),
        ('ADMIN', 'Administrator'),
        ('STAFF', 'Staff Member'),
        ('RESEARCHER', 'Researcher'),
        ('PHARMACY', 'Pharmacy'),
        ('INSURANCE', 'Insurance Provider'),
    ]
    
    VERIFICATION_STATUS_CHOICES = [
        ('PENDING', 'Pending Verification'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
    ]
    
    # Primary Fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    phone_number = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
        )]
    )
    
    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    # System Fields
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='PATIENT')
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='PENDING')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    
    # Security Fields
    mfa_enabled = models.BooleanField(default=False)
    backup_tokens = JSONField(default=list, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_device = models.CharField(max_length=500, blank=True)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    lockout_until = models.DateTimeField(null=True, blank=True)
    password_changed_at = models.DateTimeField(auto_now_add=True)
    
    # Location and Preferences
    country = models.CharField(max_length=3, blank=True)  # ISO country code
    timezone = models.CharField(max_length=50, default='UTC')
    language = models.CharField(max_length=10, default='en')
    
    # HIPAA and Compliance
    hipaa_authorization = models.BooleanField(default=False)
    hipaa_authorization_date = models.DateTimeField(null=True, blank=True)
    gdpr_consent = models.BooleanField(default=False)
    gdpr_consent_date = models.DateTimeField(null=True, blank=True)
    privacy_policy_accepted = models.BooleanField(default=False)
    terms_accepted = models.BooleanField(default=False)
    
    # Audit Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_users')
    
    # Metadata
    metadata = JSONField(default=dict, blank=True)
    profile_completed = models.BooleanField(default=False)
    onboarding_completed = models.BooleanField(default=False)
    
    objects = WebQXUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'user_type']
    
    class Meta:
        db_table = 'webqx_users'
        verbose_name = 'WebQX User'
        verbose_name_plural = 'WebQX Users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['user_type']),
            models.Index(fields=['verification_status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['last_activity']),
            models.Index(fields=['country']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        """Return the full name of the user"""
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}".strip()
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        """Return the short name for the user"""
        return self.first_name
    
    def is_locked_out(self):
        """Check if user is currently locked out"""
        if self.lockout_until and self.lockout_until > timezone.now():
            return True
        return False
    
    def increment_failed_login(self):
        """Increment failed login attempts and lock account if necessary"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.lockout_until = timezone.now() + timedelta(minutes=15)
        self.save(update_fields=['failed_login_attempts', 'lockout_until'])
    
    def reset_failed_login(self):
        """Reset failed login attempts"""
        self.failed_login_attempts = 0
        self.lockout_until = None
        self.save(update_fields=['failed_login_attempts', 'lockout_until'])
    
    def can_access_admin(self):
        """Check if user can access admin interface"""
        return self.is_staff and self.is_verified and self.mfa_enabled
    
    def requires_mfa(self):
        """Check if user requires MFA based on user type"""
        mfa_required_types = ['PROVIDER', 'ADMIN', 'STAFF']
        return self.user_type in mfa_required_types
    
    def update_last_activity(self):
        """Update last activity timestamp"""
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])
    
    def is_profile_complete(self):
        """Check if user profile is complete"""
        required_fields = [
            self.first_name,
            self.last_name,
            self.email,
            self.user_type,
        ]
        
        if self.user_type == 'PATIENT':
            required_fields.extend([
                self.date_of_birth,
                self.hipaa_authorization,
                self.privacy_policy_accepted,
                self.terms_accepted,
            ])
        elif self.user_type == 'PROVIDER':
            required_fields.extend([
                self.phone_number,
                self.verification_status == 'VERIFIED',
                self.mfa_enabled,
            ])
        
        return all(field for field in required_fields)


class UserLoginHistory(models.Model):
    """Track user login history for security auditing"""
    
    LOGIN_STATUS_CHOICES = [
        ('SUCCESS', 'Successful Login'),
        ('FAILED', 'Failed Login'),
        ('BLOCKED', 'Blocked Login'),
        ('MFA_REQUIRED', 'MFA Required'),
        ('MFA_FAILED', 'MFA Failed'),
    ]
    
    user = models.ForeignKey(WebQXUser, on_delete=models.CASCADE, related_name='login_history')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    device_fingerprint = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=LOGIN_STATUS_CHOICES)
    failure_reason = models.CharField(max_length=255, blank=True)
    session_id = models.CharField(max_length=255, blank=True)
    
    class Meta:
        db_table = 'webqx_user_login_history'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['status']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.status} at {self.timestamp}"


class UserSecurityEvent(models.Model):
    """Track security events for users"""
    
    EVENT_TYPE_CHOICES = [
        ('PASSWORD_CHANGE', 'Password Change'),
        ('EMAIL_CHANGE', 'Email Change'),
        ('MFA_ENABLED', 'MFA Enabled'),
        ('MFA_DISABLED', 'MFA Disabled'),
        ('ACCOUNT_LOCKED', 'Account Locked'),
        ('ACCOUNT_UNLOCKED', 'Account Unlocked'),
        ('SUSPICIOUS_LOGIN', 'Suspicious Login'),
        ('DATA_EXPORT', 'Data Export'),
        ('PERMISSION_CHANGE', 'Permission Change'),
        ('PROFILE_UPDATE', 'Profile Update'),
    ]
    
    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(WebQXUser, on_delete=models.CASCADE, related_name='security_events')
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='LOW')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    description = models.TextField()
    metadata = JSONField(default=dict, blank=True)
    investigated = models.BooleanField(default=False)
    investigated_by = models.ForeignKey(
        WebQXUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='investigated_events'
    )
    investigation_notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'webqx_user_security_events'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['event_type']),
            models.Index(fields=['severity']),
            models.Index(fields=['investigated']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.event_type} ({self.severity})"


class UserSession(models.Model):
    """Track active user sessions"""
    
    session_key = models.CharField(max_length=40, primary_key=True)
    user = models.ForeignKey(WebQXUser, on_delete=models.CASCADE, related_name='sessions')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    device_type = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'webqx_user_sessions'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['last_activity']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.session_key[:8]}..."
    
    def is_expired(self):
        """Check if session is expired"""
        return timezone.now() > self.expires_at
    
    def extend_session(self, minutes=60):
        """Extend session expiry"""
        self.expires_at = timezone.now() + timedelta(minutes=minutes)
        self.save(update_fields=['expires_at', 'last_activity'])
