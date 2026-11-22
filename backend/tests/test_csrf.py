# CSRF middleware sanity test

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_route_bypasses_csrf():
    """Any route under /api/* should NOT raise a CSRF error."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    # The response body is defined in the health endpoint (if any); just ensure we got JSON
    assert resp.headers["content-type"].startswith("application/json")

def test_non_api_route_requires_csrf_token():
    """A non‑API route should reject requests without a valid CSRF token.
    The exact status may be 403 or 400 depending on middleware implementation.
    """
    resp = client.get("/dashboard")
    # Expect a 403 Forbidden due to missing CSRF token
    assert resp.status_code in (400, 403)
