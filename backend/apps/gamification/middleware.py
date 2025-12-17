from django.utils.deprecation import MiddlewareMixin
from .services import GamificationService


class StreakMiddleware(MiddlewareMixin):
    """Middleware to automatically update user streak on each request"""

    def process_request(self, request):
        if request.user.is_authenticated and not request.path.startswith('/admin/'):
            # Only update once per session to avoid multiple updates
            session_key = 'streak_updated_today'

            if not request.session.get(session_key):
                result = GamificationService.update_streak(request.user)
                request.session[session_key] = True
                request.session.modified = True

                # Store result in request for potential use
                request.streak_update = result

        return None