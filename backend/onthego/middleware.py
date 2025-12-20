from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs


@database_sync_to_async
def get_user_from_token(token_key):
    """Get user from JWT token"""
    # ✅ ALL imports inside function to avoid circular dependency
    from django.contrib.auth.models import AnonymousUser
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.tokens import AccessToken
    from rest_framework_simplejwt.exceptions import TokenError

    User = get_user_model()

    try:
        # Validate token
        access_token = AccessToken(token_key)
        user_id = access_token['user_id']

        # Get user
        user = User.objects.get(id=user_id)
        return user
    except (TokenError, User.DoesNotExist, KeyError):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using JWT tokens
    Token is passed as query parameter: ws://host/path/?token=<jwt_token>
    """

    async def __call__(self, scope, receive, send):
        # ✅ Lazy import to avoid circular dependency
        from django.contrib.auth.models import AnonymousUser

        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        # Authenticate user
        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)