import uuid

from fastapi.testclient import TestClient

from app.main import app


def test_dashboard_trends_are_scoped_to_authenticated_artisan():
    client = TestClient(app)
    phone = f"97{str(uuid.uuid4().int)[:8]}"
    register = client.post("/api/auth/register", json={
        "name": "Trend Test Artisan",
        "phone": phone,
        "password": "Password123",
        "role": "ARTISAN",
    }).json()
    headers = {"Authorization": f"Bearer {register['data']['token']}"}

    client.post("/api/products", headers=headers)
    response = client.get("/api/dashboard", headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total_products"] == 1
    assert len(data["trends"]["monthly_activity"]) == 6
    assert sum(point["count"] for point in data["trends"]["monthly_activity"]) == 1
    assert data["trends"]["categories"] == []
    assert data["trends"]["priced_products"] == 0
    assert data["trends"]["open_opportunities"] == 0