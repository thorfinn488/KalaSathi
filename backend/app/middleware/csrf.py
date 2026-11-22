import secrets
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# HTTP methods that are considered safe and do not require CSRF protection
SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}

class CSRFMiddleware(BaseHTTPMiddleware):
    """CSRF protection middleware.

    - Bypasses CSRF checks for all API routes ("/api/*") because they use token‑based
      authentication and are not vulnerable to CSRF.
    - For non‑API routes, enforces a matching ``X‑CSRF‑Token`` header against a token
      stored in the user's session.
    - Generates a token for safe methods when a session exists.
    """

    async def dispatch(self, request: Request, call_next):
        # Skip CSRF protection for API endpoints.
        if request.url.path.startswith("/api"):
            response = await call_next(request)
            return response

        # For non‑API routes, enforce CSRF protection.
        if request.method not in SAFE_METHODS:
            # Require a session to validate the token.
            if "session" not in request.scope:
                return Response(status_code=403, content="Session is required for CSRF protection")
            header_token = request.headers.get("X‑CSRF‑Token")
            session_token = request.session.get("csrf_token")
            if not header_token or not session_token or header_token != session_token:
                return Response(status_code=403, content="CSRF token missing or invalid")
        else:
            # Ensure a token exists for safe methods when a session is present.
            if "session" in request.scope and "csrf_token" not in request.session:
                request.session["csrf_token"] = secrets.token_urlsafe(32)

        response: Response = await call_next(request)
        # Expose the CSRF token to the client via a response header when a session exists.
        if "session" in request.scope:
            response.headers["X‑CSRF‑Token"] = request.session.get("csrf_token", "")
        return response