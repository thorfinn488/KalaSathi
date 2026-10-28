import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import date
from decimal import Decimal
from typing import Any
from urllib.parse import unquote, urlsplit
from uuid import UUID

import psycopg2
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from psycopg2.extras import RealDictCursor


logger = logging.getLogger(__name__)


def validate_order_database_target() -> None:
    database_url = os.getenv("ORDER_DATABASE_URL")
    if not database_url:
        raise RuntimeError("Refusing to start Order API: ORDER_DATABASE_URL is not set")

    database_name = unquote(urlsplit(database_url).path.lstrip("/"))
    if not database_name:
        raise RuntimeError("Refusing to start Order API: ORDER_DATABASE_URL does not name a database")
    if database_name.endswith("_test") or os.getenv("ALLOW_LIVE_ORDER_DB") == "1":
        return

    raise RuntimeError(
        f"Refusing to start Order API: ORDER_DATABASE_URL targets database "
        f"{database_name!r}, which does not end in '_test'. "
        "Set ALLOW_LIVE_ORDER_DB=1 to allow a live database."
    )


@asynccontextmanager
async def lifespan(_: FastAPI):
    validate_order_database_target()
    yield


app = FastAPI(title="KalaSaathi Order API", version="1.0.0", lifespan=lifespan)


def get_connection():
    database_url = os.getenv("ORDER_DATABASE_URL")
    if not database_url:
        raise HTTPException(status_code=503, detail="ORDER_DATABASE_URL is not configured")

    connection = psycopg2.connect(database_url)
    try:
        yield connection
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@app.exception_handler(psycopg2.Error)
async def handle_database_error(_, error: psycopg2.Error):
    message = error.diag.message_primary if error.diag else str(error)
    if error.pgcode == "23514":
        code = status.HTTP_409_CONFLICT
    elif error.pgcode == "22P02":
        code = status.HTTP_422_UNPROCESSABLE_ENTITY
    else:
        logger.exception("Order API database error (SQLSTATE %s)", error.pgcode)
        code = status.HTTP_500_INTERNAL_SERVER_ERROR
        message = "Database operation failed"
    return JSONResponse(status_code=code, content={"detail": message})


class ProductCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    artisan_id: UUID
    name: str = Field(min_length=1, max_length=255)
    unit_price: Decimal = Field(gt=0)
    stock: int = Field(ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)


class ProductPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stock_adjustment: int
    unit_price: Decimal | None = Field(default=None, gt=0)


class OrderLineInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: UUID
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer_id: UUID
    items: list[OrderLineInput] = Field(min_length=1)


class ExpenseCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    artisan_id: UUID
    description: str = Field(min_length=1)
    amount: Decimal = Field(gt=0)
    expense_date: date | None = None


PRODUCT_COLUMNS = "id, artisan_id, name, unit_price, stock, low_stock_threshold, created_at"


@app.get("/products")
def list_products(connection=Depends(get_connection)):
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(f"SELECT {PRODUCT_COLUMNS} FROM products ORDER BY name, id")
        return cursor.fetchall()


@app.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, connection=Depends(get_connection)):
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """INSERT INTO products (artisan_id, name, unit_price, stock, low_stock_threshold)
                   VALUES (%s, %s, %s, %s, %s) RETURNING """ + PRODUCT_COLUMNS,
                (
                    str(payload.artisan_id), payload.name, payload.unit_price,
                    payload.stock, payload.low_stock_threshold,
                ),
            )
            product = cursor.fetchone()
        connection.commit()
        return product
    except Exception:
        connection.rollback()
        raise


@app.get("/products/low-stock")
def list_low_stock(connection=Depends(get_connection)):
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM v_low_stock ORDER BY product_name, product_id")
        return cursor.fetchall()


@app.patch("/products/{product_id}")
def update_product(
    product_id: UUID,
    payload: ProductPatch,
    connection=Depends(get_connection),
):
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT stock FROM products WHERE id = %s FOR UPDATE", (str(product_id),))
            product = cursor.fetchone()
            if product is None:
                raise HTTPException(status_code=404, detail="Product not found")
            updated_stock = product["stock"] + payload.stock_adjustment
            if updated_stock < 0:
                raise HTTPException(status_code=409, detail="Stock adjustment would make stock negative")

            cursor.execute(
                """UPDATE products
                   SET stock = stock + %s, unit_price = COALESCE(%s, unit_price)
                   WHERE id = %s RETURNING """ + PRODUCT_COLUMNS,
                (payload.stock_adjustment, payload.unit_price, str(product_id)),
            )
            updated_product = cursor.fetchone()
        connection.commit()
        return updated_product
    except Exception:
        connection.rollback()
        raise


def fetch_order_lines(cursor, order_ids: list[Any]) -> dict[Any, list[dict[str, Any]]]:
    if not order_ids:
        return {}
    cursor.execute(
        """SELECT oi.id, oi.order_id, oi.product_id, p.name AS product_name,
                  oi.quantity, oi.unit_price, oi.line_total
           FROM order_items oi JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id = ANY(%s::uuid[]) ORDER BY oi.order_id, oi.id""",
        (order_ids,),
    )
    grouped: dict[Any, list[dict[str, Any]]] = {}
    for line in cursor.fetchall():
        grouped.setdefault(line["order_id"], []).append(dict(line))
    return grouped


@app.post("/orders", status_code=status.HTTP_201_CREATED)
def place_order(payload: OrderCreate, connection=Depends(get_connection)):
    items = [
        {"product_id": str(item.product_id), "quantity": item.quantity}
        for item in payload.items
    ]
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT fn_place_order(%s, %s::jsonb) AS order_id",
                (str(payload.customer_id), json.dumps(items)),
            )
            order_id = cursor.fetchone()["order_id"]
            cursor.execute(
                "SELECT id, customer_id, order_date, status, total_amount FROM orders WHERE id = %s",
                (order_id,),
            )
            order = dict(cursor.fetchone())
            lines = fetch_order_lines(cursor, [order_id]).get(order_id, [])
            result = {"order_id": order_id, **order, "lines": lines}
        connection.commit()
        return result
    except Exception:
        connection.rollback()
        raise


@app.get("/orders")
def list_orders(connection=Depends(get_connection)):
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT id, customer_id, order_date, status, total_amount FROM orders ORDER BY order_date DESC, id")
        orders = [dict(row) for row in cursor.fetchall()]
        lines_by_order = fetch_order_lines(cursor, [row["id"] for row in orders])
        return [{**row, "lines": lines_by_order.get(row["id"], [])} for row in orders]


@app.get("/expenses")
def list_expenses(connection=Depends(get_connection)):
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT id, artisan_id, description, amount, expense_date FROM expenses ORDER BY expense_date DESC, id")
        return cursor.fetchall()


@app.post("/expenses", status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate, connection=Depends(get_connection)):
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """INSERT INTO expenses (artisan_id, description, amount, expense_date)
                   VALUES (%s, %s, %s, COALESCE(%s, CURRENT_DATE))
                   RETURNING id, artisan_id, description, amount, expense_date""",
                (str(payload.artisan_id), payload.description, payload.amount, payload.expense_date),
            )
            expense = cursor.fetchone()
        connection.commit()
        return expense
    except Exception:
        connection.rollback()
        raise


@app.get("/artisans/profit")
def artisan_profit(connection=Depends(get_connection)):
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """WITH revenue AS (
                   SELECT p.artisan_id, sum(oi.quantity * oi.unit_price) AS revenue
                   FROM order_items oi
                   JOIN orders o ON o.id = oi.order_id
                   JOIN products p ON p.id = oi.product_id
                   WHERE o.status <> 'CANCELLED'
                   GROUP BY p.artisan_id
               ), costs AS (
                   SELECT artisan_id, sum(amount) AS expenses
                   FROM expenses GROUP BY artisan_id
               )
               SELECT a.id AS artisan_id, a.name AS artisan,
                      COALESCE(r.revenue, 0) AS revenue,
                      COALESCE(c.expenses, 0) AS expenses,
                      COALESCE(r.revenue, 0) - COALESCE(c.expenses, 0) AS net_profit
               FROM artisans a
               LEFT JOIN revenue r ON r.artisan_id = a.id
               LEFT JOIN costs c ON c.artisan_id = a.id
               ORDER BY a.name"""
        )
        return cursor.fetchall()


@app.get("/ai-insights")
def list_ai_insights(connection=Depends(get_connection)):
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT id, artisan_id, payload, created_at FROM ai_insights ORDER BY created_at DESC, id")
        return cursor.fetchall()