import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'onthego.settings')

# ⚠️ CRITICAL: Initialize Django ASGI application early to populate AppRegistry
# This MUST be called before importing code that may import ORM models
django_asgi_app = get_asgi_application()

# ✅ NOW it's safe to import code that uses Django models/apps
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from onthego.routing import websocket_urlpatterns
from onthego.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})