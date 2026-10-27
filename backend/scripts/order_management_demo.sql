-- Standalone PostgreSQL order-management demo.
-- Run only in a disposable database: this script drops these demo tables.

BEGIN;

DROP VIEW IF EXISTS v_low_stock;
DROP TABLE IF EXISTS order_items, orders, expenses, ai_insights, products, customers, artisans, crafts CASCADE;
DROP FUNCTION IF EXISTS fn_place_order(uuid, jsonb);
DROP FUNCTION IF EXISTS fn_sync_order_total();
DROP FUNCTION IF EXISTS fn_control_product_stock();

CREATE TABLE crafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text NOT NULL DEFAULT '',
    CONSTRAINT crafts_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE artisans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    craft_id uuid NOT NULL REFERENCES crafts(id) ON DELETE RESTRICT,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    region text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT artisans_email_format CHECK (position('@' IN email) > 1),
    CONSTRAINT artisans_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artisan_id uuid NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
    name text NOT NULL,
    unit_price numeric(12, 2) NOT NULL,
    stock integer NOT NULL DEFAULT 0,
    low_stock_threshold integer NOT NULL DEFAULT 5,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT products_artisan_name_unique UNIQUE (artisan_id, name),
    CONSTRAINT products_unit_price_positive CHECK (unit_price > 0),
    CONSTRAINT products_stock_nonnegative CHECK (stock >= 0),
    CONSTRAINT products_threshold_nonnegative CHECK (low_stock_threshold >= 0)
);

CREATE INDEX idx_products_artisan_id ON products (artisan_id);
CREATE INDEX idx_products_low_stock ON products (stock, low_stock_threshold)
    WHERE stock <= low_stock_threshold;

CREATE TABLE customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT customers_email_format CHECK (position('@' IN email) > 1),
    CONSTRAINT customers_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    order_date timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'PLACED',
    total_amount numeric(14, 2) NOT NULL DEFAULT 0,
    CONSTRAINT orders_status_valid CHECK (status IN ('PLACED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT orders_total_nonnegative CHECK (total_amount >= 0)
);

CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date DESC);

CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity integer NOT NULL,
    unit_price numeric(12, 2) NOT NULL,
    line_total numeric(14, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    CONSTRAINT order_items_order_product_unique UNIQUE (order_id, product_id),
    CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT order_items_unit_price_positive CHECK (unit_price > 0)
);

CREATE TABLE expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artisan_id uuid NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    expense_date date NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT expenses_amount_positive CHECK (amount > 0),
    CONSTRAINT expenses_description_not_blank CHECK (btrim(description) <> '')
);

CREATE TABLE ai_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artisan_id uuid NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ai_insights_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX idx_ai_insights_payload_gin ON ai_insights USING gin (payload);

-- Atomically reserve or restore stock. UPDATE takes a row lock; the stock predicate
-- prevents concurrent orders from selling more than the available quantity.
CREATE FUNCTION fn_control_product_stock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    changed_rows integer;
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE products
        SET stock = stock - NEW.quantity
        WHERE id = NEW.product_id AND stock >= NEW.quantity;
        GET DIAGNOSTICS changed_rows = ROW_COUNT;
        IF changed_rows = 0 THEN
            RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id
                USING ERRCODE = 'check_violation';
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE products SET stock = stock + OLD.quantity WHERE id = OLD.product_id;
        RETURN OLD;
    ELSIF OLD.product_id = NEW.product_id THEN
        IF NEW.quantity > OLD.quantity THEN
            UPDATE products
            SET stock = stock - (NEW.quantity - OLD.quantity)
            WHERE id = NEW.product_id AND stock >= (NEW.quantity - OLD.quantity);
            GET DIAGNOSTICS changed_rows = ROW_COUNT;
            IF changed_rows = 0 THEN
                RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id
                    USING ERRCODE = 'check_violation';
            END IF;
        ELSIF NEW.quantity < OLD.quantity THEN
            UPDATE products SET stock = stock + (OLD.quantity - NEW.quantity)
            WHERE id = OLD.product_id;
        END IF;
        RETURN NEW;
    ELSE
        UPDATE products SET stock = stock + OLD.quantity WHERE id = OLD.product_id;
        UPDATE products
        SET stock = stock - NEW.quantity
        WHERE id = NEW.product_id AND stock >= NEW.quantity;
        GET DIAGNOSTICS changed_rows = ROW_COUNT;
        IF changed_rows = 0 THEN
            RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id
                USING ERRCODE = 'check_violation';
        END IF;
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER trg_order_items_stock
BEFORE INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION fn_control_product_stock();

-- Keep the parent total correct when an item is inserted, changed, or removed.
CREATE FUNCTION fn_sync_order_total()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE orders SET total_amount = total_amount + NEW.line_total WHERE id = NEW.order_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE orders SET total_amount = total_amount - OLD.line_total WHERE id = OLD.order_id;
        RETURN OLD;
    END IF;

    IF OLD.order_id = NEW.order_id THEN
        UPDATE orders
        SET total_amount = total_amount + NEW.line_total - OLD.line_total
        WHERE id = NEW.order_id;
    ELSE
        UPDATE orders SET total_amount = total_amount - OLD.line_total WHERE id = OLD.order_id;
        UPDATE orders SET total_amount = total_amount + NEW.line_total WHERE id = NEW.order_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_items_total
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION fn_sync_order_total();

-- A function call is one PostgreSQL statement and runs within the caller's
-- transaction. Any raised exception rolls back the order and all its items.
CREATE FUNCTION fn_place_order(p_customer_id uuid, p_items jsonb)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    new_order_id uuid;
    item jsonb;
    selected_product_id uuid;
    selected_quantity integer;
    selected_price numeric(12, 2);
BEGIN
    IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one item' USING ERRCODE = 'invalid_parameter_value';
    END IF;

    INSERT INTO orders (customer_id) VALUES (p_customer_id) RETURNING id INTO new_order_id;

    FOR item IN SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        selected_product_id := (item ->> 'product_id')::uuid;
        selected_quantity := (item ->> 'quantity')::integer;

        SELECT unit_price INTO selected_price FROM products WHERE id = selected_product_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Unknown product %', selected_product_id USING ERRCODE = 'foreign_key_violation';
        END IF;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (new_order_id, selected_product_id, selected_quantity, selected_price);
    END LOOP;

    RETURN new_order_id;
END;
$$;

CREATE VIEW v_low_stock AS
SELECT p.id AS product_id, p.name AS product_name, a.id AS artisan_id,
       a.name AS artisan_name, p.stock, p.low_stock_threshold
FROM products p
JOIN artisans a ON a.id = p.artisan_id
WHERE p.stock <= p.low_stock_threshold;

-- Small demo dataset.
INSERT INTO crafts (name, description) VALUES
    ('Phulkari', 'Traditional Punjab embroidery'),
    ('Madhubani', 'Traditional Mithila folk painting');

INSERT INTO artisans (craft_id, name, email, region)
SELECT id, 'Sunita Devi', 'sunita@example.test', 'Patiala, Punjab' FROM crafts WHERE name = 'Phulkari';
INSERT INTO artisans (craft_id, name, email, region)
SELECT id, 'Mithila Arts Collective', 'mithila@example.test', 'Madhubani, Bihar' FROM crafts WHERE name = 'Madhubani';

INSERT INTO products (artisan_id, name, unit_price, stock, low_stock_threshold)
SELECT id, 'Embroidered Dupatta', 1800.00, 12, 3 FROM artisans WHERE email = 'sunita@example.test';
INSERT INTO products (artisan_id, name, unit_price, stock, low_stock_threshold)
SELECT id, 'Madhubani Painting', 2500.00, 8, 2 FROM artisans WHERE email = 'mithila@example.test';

INSERT INTO customers (name, email, phone) VALUES
    ('Anaya Retail', 'anaya@example.test', '+91-9000000001'),
    ('Craft House', 'craft-house@example.test', '+91-9000000002');

INSERT INTO expenses (artisan_id, description, amount)
SELECT id, 'Thread and fabric', 450.00 FROM artisans WHERE email = 'sunita@example.test';
INSERT INTO expenses (artisan_id, description, amount)
SELECT id, 'Natural pigments and paper', 600.00 FROM artisans WHERE email = 'mithila@example.test';

INSERT INTO ai_insights (artisan_id, payload)
SELECT id, '{"kind":"demand","summary":"Strong interest in handmade regional crafts"}'::jsonb
FROM artisans WHERE email = 'sunita@example.test';

DO $$
DECLARE
    customer_id uuid;
    product_id uuid;
    created_order_id uuid;
BEGIN
    SELECT id INTO customer_id FROM customers WHERE email = 'anaya@example.test';
    SELECT id INTO product_id FROM products WHERE name = 'Embroidered Dupatta';

    created_order_id := fn_place_order(
        customer_id,
        jsonb_build_array(jsonb_build_object('product_id', product_id, 'quantity', 2))
    );
    RAISE NOTICE 'Successful demo order: %', created_order_id;

    BEGIN
        PERFORM fn_place_order(
            customer_id,
            jsonb_build_array(jsonb_build_object('product_id', product_id, 'quantity', 100000))
        );
        RAISE EXCEPTION 'Oversell demo unexpectedly succeeded';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'Expected oversell rejected; failed order was rolled back';
    END;
END;
$$;

-- Net revenue minus recorded expenses for each artisan.
SELECT a.name AS artisan,
       COALESCE(sales.revenue, 0) AS revenue,
       COALESCE(costs.expenses, 0) AS expenses,
       COALESCE(sales.revenue, 0) - COALESCE(costs.expenses, 0) AS net_profit
FROM artisans a
LEFT JOIN (
    SELECT p.artisan_id, sum(oi.line_total) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status IN ('PLACED', 'COMPLETED')
    GROUP BY p.artisan_id
) sales ON sales.artisan_id = a.id
LEFT JOIN (
    SELECT artisan_id, sum(amount) AS expenses
    FROM expenses
    GROUP BY artisan_id
) costs ON costs.artisan_id = a.id
ORDER BY a.name;

COMMIT;
