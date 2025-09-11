# WebQX Django Management Commands
# Production-ready Django project setup

import os
import sys
import django
from django.conf import settings
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webqx_auth.settings')
    execute_from_command_line(sys.argv)
