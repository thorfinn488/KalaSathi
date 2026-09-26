from fastapi.testclient import TestClient

from app.main import app


def test_healthz_and_legacy_health_alias():
    client = TestClient(app)

    for path in ("/healthz", "/health"):
        response = client.get(path)

        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
