import os
from pathlib import Path
from urllib.parse import unquote, urlsplit

import psycopg2
import pytest


DEMO_SQL = Path(__file__).resolve().parents[2] / "scripts" / "order_management_demo.sql"
GRANTS_SQL = Path(__file__).resolve().parents[2] / "scripts" / "order_api_grants.sql"


def validated_database_urls() -> tuple[str, str]:
    urls = {
        "ORDER_DATABASE_URL": os.environ.get("ORDER_DATABASE_URL"),
        "TEST_ADMIN_DATABASE_URL": os.environ.get("TEST_ADMIN_DATABASE_URL"),
    }
    for variable, database_url in urls.items():
        if not database_url:
            raise pytest.UsageError(f"{variable} must be set to a database ending in _test")

        parsed_url = urlsplit(database_url)
        database_name = unquote(parsed_url.path.lstrip("/"))
        if not database_name.endswith("_test"):
            raise pytest.UsageError(
                f"Refusing order API tests: {variable} targets {database_name!r}; "
                "the database name must end in '_test'"
            )
        expected_user = "order_api" if variable == "ORDER_DATABASE_URL" else "postgres"
        if parsed_url.username != expected_user:
            raise pytest.UsageError(f"{variable} must connect as {expected_user!r}")

    order_database_name = unquote(urlsplit(urls["ORDER_DATABASE_URL"]).path.lstrip("/"))
    admin_database_name = unquote(urlsplit(urls["TEST_ADMIN_DATABASE_URL"]).path.lstrip("/"))
    if order_database_name != admin_database_name:
        raise pytest.UsageError("ORDER_DATABASE_URL and TEST_ADMIN_DATABASE_URL must target the same test database")

    return urls["ORDER_DATABASE_URL"], urls["TEST_ADMIN_DATABASE_URL"]


def pytest_sessionstart(session):
    validated_database_urls()


@pytest.fixture(autouse=True)
def reset_demo_database(request):
    if request.node.name in {
        "test_validator_refuses_live_database_without_override",
        "test_startup_refuses_live_database_without_override",
    }:
        yield
        return

    _, admin_database_url = validated_database_urls()
    connection = psycopg2.connect(admin_database_url)
    connection.autocommit = True
    try:
        with connection.cursor() as cursor:
            cursor.execute(DEMO_SQL.read_text(encoding="utf-8"))
            cursor.execute(GRANTS_SQL.read_text(encoding="utf-8"))
    finally:
        connection.close()
    yield
