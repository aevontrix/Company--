"""
Custom throttling classes for rate limiting sensitive endpoints.
"""

from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """
    Rate limit for login attempts.
    Limits by IP address to prevent brute force attacks.
    """
    scope = 'login'

    def get_cache_key(self, request, view):
        # Use IP address as identifier
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class RegisterRateThrottle(SimpleRateThrottle):
    """
    Rate limit for registration attempts.
    Prevents mass account creation.
    """
    scope = 'register'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class PasswordResetRateThrottle(SimpleRateThrottle):
    """
    Rate limit for password reset requests.
    Prevents abuse of password reset functionality.
    """
    scope = 'password_reset'

    def get_cache_key(self, request, view):
        # Rate limit by email if provided, otherwise by IP
        email = request.data.get('email', '')
        if email:
            ident = email.lower()
        else:
            ident = self.get_ident(request)

        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class SearchRateThrottle(SimpleRateThrottle):
    """
    Rate limit for search API.
    Prevents abuse of search functionality.
    """
    scope = 'search'

    def get_cache_key(self, request, view):
        # Only throttle if search query is present
        if not request.query_params.get('search'):
            return None

        # Use user ID if authenticated, otherwise IP
        if request.user.is_authenticated:
            ident = str(request.user.id)
        else:
            ident = self.get_ident(request)

        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }
