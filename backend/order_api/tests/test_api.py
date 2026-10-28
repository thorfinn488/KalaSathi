import os

import psycopg2
import pytest
from fastapi.testclient import TestClient

from order_api.main import app, validate_order_database_target


def test_validator_refuses_live_database_without_override(monkeypatch):
    monkeypatch.setenv("ORDER_DATABASE_URL", "postgresql://order_api@127.0.0.1:5433/kalasathi")
    monkeypatch.delenv("ALLOW_LIVE_ORDER_DB", raising=False)

    with pytest.raises(RuntimeError, match="database 'kalasathi'"):
        validate_order_database_target()


def test_startup_refuses_live_database_without_override(monkeypatch):
    monkeypatch.setenv("ORDER_DATABASE_URL", "postgresql://order_api@127.0.0.1:5433/kalasathi")
    monkeypatch.delenv("ALLOW_LIVE_ORDER_DB", raising=False)

    with pytest.raises(RuntimeError, match="database 'kalasathi'"):
        with TestClient(app):
            pass


def test_database_connections_use_expected_roles():
    expected_users = {
        "ORDER_DATABASE_URL": "order_api",
        "TEST_ADMIN_DATABASE_URL": "postgres",
    }
    for variable, expected_user in expected_users.items():
        with psycopg2.connect(os.environ[variable]) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT current_user")
                current_user = cursor.fetchone()[0]
        assert current_user == expected_user, (
            f"{variable} connected as {current_user!r}; expected {expected_user!r}"
        )


@pytest.fixture
def database_connection():
    database_url = os.environ.get("TEST_ADMIN_DATABASE_URL")
    if not database_url:
        pytest.fail("TEST_ADMIN_DATABASE_URL must point to the isolated test database")
    connection = psycopg2.connect(database_url)
    try:
        yield connection
    finally:
        connection.rollback()
        connection.close()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def read_database_state():
    with psycopg2.connect(os.environ["TEST_ADMIN_DATABASE_URL"]) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """SELECT
                       (SELECT count(*) FROM orders),
                       (SELECT count(*) FROM order_items),
                       (SELECT stock FROM products WHERE name = %s)""",
                ("Embroidered Dupatta",),
            )
            return cursor.fetchone()


def get_seeded_ids(connection):
    with connection.cursor() as cursor:
        cursor.execute("SELECT id FROM products WHERE name = %s", ("Embroidered Dupatta",))
        product_id = cursor.fetchone()[0]
        cursor.execute("SELECT id FROM customers WHERE email = %s", ("anaya@example.test",))
        customer_id = cursor.fetchone()[0]
    return product_id, customer_id


def test_successful_order_commits(client, database_connection):
    product_id, customer_id = get_seeded_ids(database_connection)
    before_orders, before_items, before_stock = read_database_state()
    response = client.post(
        "/orders",
        json={
            "customer_id": str(customer_id),
            "items": [{"product_id": str(product_id), "quantity": 1}],
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["lines"][0]["quantity"] == 1
    after_orders, after_items, after_stock = read_database_state()
    assert (before_orders, before_items, before_stock) == (1, 1, 10)
    assert (after_orders, after_items, after_stock) == (2, 2, 9)


def test_reset_restores_demo_baseline(client):
    assert read_database_state() == (1, 1, 10)
    response = client.get("/artisans/profit")
    assert response.status_code == 200, response.text
    profits = {row["artisan"]: row["net_profit"] for row in response.json()}
    assert profits == {"Mithila Arts Collective": -600, "Sunita Devi": 3150}


def test_oversell_returns_conflict(client, database_connection):
    product_id, customer_id = get_seeded_ids(database_connection)
    before_state = read_database_state()
    response = client.post(
        "/orders",
        json={
            "customer_id": str(customer_id),
            "items": [{"product_id": str(product_id), "quantity": before_state[2] + 1}],
        },
    )
    assert response.status_code == 409, response.text
    assert response.json()["detail"].startswith("Insufficient stock")
    assert read_database_state() == before_state


def test_negative_stock_adjustment_returns_conflict(client, database_connection):
    product_id, _ = get_seeded_ids(database_connection)
    before_state = read_database_state()
    response = client.patch(
        f"/products/{product_id}",
        json={"stock_adjustment": -(before_state[2] + 1)},
    )
    assert response.status_code == 409, response.text
    assert response.json()["detail"] == "Stock adjustment would make stock negative"
    assert read_database_state() == before_state


def test_profit_matches_seeded_checks_values(client):
    response = client.get("/artisans/profit")
    assert response.status_code == 200, response.text
    profits = {row["artisan"]: row["net_profit"] for row in response.json()}
    assert profits == {
        "Mithila Arts Collective": -600,
        "Sunita Devi": 3150,
    }


def test_create_product(client, database_connection):
    with database_connection.cursor() as cursor:
        cursor.execute("SELECT id FROM artisans WHERE email = %s", ("sunita@example.test",))
        artisan_id = cursor.fetchone()[0]
    response = client.post(
        "/products",
        json={
            "artisan_id": str(artisan_id),
            "name": "Test Woven Basket",
            "unit_price": "725.00",
            "stock": 4,
            "low_stock_threshold": 2,
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["name"] == "Test Woven Basket"
    assert response.json()["stock"] == 4


def test_positive_stock_patch_returns_new_stock(client, database_connection):
    product_id, _ = get_seeded_ids(database_connection)
    response = client.patch(f"/products/{product_id}", json={"stock_adjustment": 2})
    assert response.status_code == 200, response.text
    assert response.json()["stock"] == 12


def test_list_orders_includes_lines_for_placed_order(client):
    response = client.get("/orders")
    assert response.status_code == 200, response.text
    order = next(row for row in response.json() if row["status"] == "PLACED")
    assert any(
        line["product_name"] == "Embroidered Dupatta" and line["quantity"] == 2
        for line in order["lines"]
    )


def test_create_and_list_expenses(client, database_connection):
    with database_connection.cursor() as cursor:
        cursor.execute("SELECT id FROM artisans WHERE email = %s", ("sunita@example.test",))
        artisan_id = cursor.fetchone()[0]
    created = client.post(
        "/expenses",
        json={"artisan_id": str(artisan_id), "description": "Test packaging", "amount": "12.50"},
    )
    assert created.status_code == 201, created.text
    listed = client.get("/expenses")
    assert listed.status_code == 200, listed.text
    assert any(row["id"] == created.json()["id"] for row in listed.json())


def test_ai_insights_returns_seeded_payload(client):
    response = client.get("/ai-insights")
    assert response.status_code == 200, response.text
    assert any(
        row["payload"] == {
            "kind": "demand",
            "summary": "Strong interest in handmade regional crafts",
        }
        for row in response.json()
    )


def test_malformed_product_uuid_returns_422(client):
    response = client.patch("/products/not-a-uuid", json={"stock_adjustment": 1})
    assert response.status_code == 422, response.text