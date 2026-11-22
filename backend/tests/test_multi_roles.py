import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

ROLES = ["ARTISAN", "BUYER", "ADMIN"]

@pytest.mark.parametrize("idx", range(10))
def test_register_and_login_multiple_roles(idx):
    role = ROLES[idx % len(ROLES)]
    unique_phone = f"9{idx}{str(uuid.uuid4().int)[:7]}"
    payload = {
        "name": f"User{idx}",
        "phone": unique_phone,
        "password": "Password123",
        "role": role,
        "region": "TestRegion",
        "craft_specialty": "TestCraft",
    }
    # Register (region and craft_specialty are ignored for non‑artisan roles but accepted)
    reg_resp = client.post("/api/auth/register", json=payload)
    assert reg_resp.status_code == 201, f"Register failed for role {role}: {reg_resp.text}"
    data = reg_resp.json()["data"]
    token = data["token"]
    # Login
    login_resp = client.post("/api/auth/login", json={"phone": unique_phone, "password": "Password123"})
    assert login_resp.status_code == 200, f"Login failed for role {role}: {login_resp.text}"
    # Access a protected endpoint appropriate for the role
    headers = {"Authorization": f"Bearer {token}"}
    if role == "ADMIN":
        # Admin can list all products
        resp = client.get("/api/products", headers=headers)
        assert resp.status_code == 200
    elif role == "ARTISAN":
        # Artisan can create a product (empty payload defaults)
        create_resp = client.post("/api/products", headers=headers)
        assert create_resp.status_code == 201
    elif role == "BUYER":
        # Buyer can list opportunities
        resp = client.get("/api/opportunities", headers=headers)
        assert resp.status_code == 200
