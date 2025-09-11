# WebQX Django WSGI Configuration
# Production WSGI application for deployment

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webqx_auth.settings')

application = get_wsgi_application()
