# WebQX Django ASGI Configuration
# Async application interface for WebSocket support

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webqx_auth.settings')

application = get_asgi_application()
