# WebQX Authentication App Configuration

from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authentication'
    verbose_name = 'WebQX Authentication'
    
    def ready(self):
        # Import signal handlers
        import authentication.signals
