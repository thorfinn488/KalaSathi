from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response: Response = await call_next(request)
        # Content Security Policy – restrict scripts, styles, and connections
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"
        # Referrer-Policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        # X-Content-Type-Options
        response.headers['X-Content-Type-Options'] = 'nosniff'
        # X-Frame-Options – prevent clickjacking
        response.headers['X-Frame-Options'] = 'DENY'
        # Feature-Policy (now Permissions-Policy) – tighten permissions
        response.headers['Permissions-Policy'] = "geolocation=(), microphone=(), camera=()"
        return response
