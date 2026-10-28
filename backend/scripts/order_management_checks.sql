-- Run after order_management_demo.sql against the same disposable database.
-- Each check raises an exception on failure and emits a PASS notice on success.

DO $$
DECLARE
    customer_id uuid;
    product_id uuid;
    available_stock integer;
    orders_before bigint;
    orders_after bigint;
    items_before bigint;
    items_after bigint;
    error_message text;
BEGIN
    SELECT id INTO customer_id FROM customers WHERE email = 'anaya@example.test';
    SELECT id, stock INTO product_id, available_stock
    FROM products WHERE name = 'Embroidered Dupatta';
    IF customer_id IS NULL OR product_id IS NULL THEN
        RAISE EXCEPTION 'CHECK FAILED: seeded oversell customer/product missing';
    END IF;

    SELECT count(*) INTO orders_before FROM orders;
    SELECT count(*) INTO items_before FROM order_items;
    BEGIN
        PERFORM fn_place_order(
            customer_id,
            jsonb_build_array(jsonb_build_object('product_id', product_id, 'quantity', available_stock + 1))
        );
        RAISE EXCEPTION 'CHECK FAILED: oversell was accepted';
    EXCEPTION WHEN check_violation THEN
        GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
    END;

    SELECT count(*) INTO orders_after FROM orders;
    SELECT count(*) INTO items_after FROM order_items;
    IF error_message NOT LIKE 'Insufficient stock%' THEN
        RAISE EXCEPTION 'CHECK FAILED: unexpected oversell error: %', error_message;
    END IF;
    IF orders_before <> orders_after OR items_before <> items_after THEN
        RAISE EXCEPTION 'CHECK FAILED: oversell left order rows behind (orders % -> %, items % -> %)',
            orders_before, orders_after, items_before, items_after;
    END IF;
    RAISE NOTICE 'PASS oversell rejected; error="%"; orders % -> %; order_items % -> %',
        error_message, orders_before, orders_after, items_before, items_after;
END;
$$;

DO $$
DECLARE
    product_row record;
    product_count integer := 0;
    expected_stock integer;
    ordered_quantity bigint;
BEGIN
    FOR product_row IN
        SELECT p.name, p.stock, COALESCE(sum(oi.quantity), 0) AS ordered_quantity
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        GROUP BY p.id, p.name, p.stock
        ORDER BY p.name
    LOOP
        product_count := product_count + 1;
        expected_stock := CASE product_row.name
            WHEN 'Embroidered Dupatta' THEN 12
            WHEN 'Madhubani Painting' THEN 8
            ELSE NULL
        END;
        IF expected_stock IS NULL THEN
            RAISE EXCEPTION 'CHECK FAILED: product % has no seeded stock baseline', product_row.name;
        END IF;
        ordered_quantity := product_row.ordered_quantity;
        IF product_row.stock <> expected_stock - ordered_quantity THEN
            RAISE EXCEPTION 'CHECK FAILED: product % stock expected % (seed % - ordered %), actual %',
                product_row.name, expected_stock - ordered_quantity, expected_stock,
                ordered_quantity, product_row.stock;
        END IF;
        RAISE NOTICE 'PASS stock for %: seeded % - committed quantity % = actual %',
            product_row.name, expected_stock, ordered_quantity, product_row.stock;
    END LOOP;
    IF product_count <> 2 THEN
        RAISE EXCEPTION 'CHECK FAILED: expected 2 seeded products, found %', product_count;
    END IF;
END;
$$;

DO $$
DECLARE
    order_row record;
    order_count integer := 0;
    line_sum numeric(14, 2);
BEGIN
    FOR order_row IN SELECT id, total_amount FROM orders ORDER BY id
    LOOP
        order_count := order_count + 1;
        SELECT COALESCE(sum(quantity * unit_price), 0)
        INTO line_sum
        FROM order_items
        WHERE order_id = order_row.id;
        IF order_row.total_amount <> line_sum THEN
            RAISE EXCEPTION 'CHECK FAILED: order % total expected %, actual %',
                order_row.id, line_sum, order_row.total_amount;
        END IF;
        RAISE NOTICE 'PASS order % total_amount=% equals item sum=%',
            order_row.id, order_row.total_amount, line_sum;
    END LOOP;
    IF order_count = 0 THEN
        RAISE EXCEPTION 'CHECK FAILED: no successful demo order found';
    END IF;
END;
$$;

DROP TABLE IF EXISTS _order_management_price_snapshot;
CREATE TEMP TABLE _order_management_price_snapshot ON COMMIT PRESERVE ROWS AS
SELECT p.id AS product_id,
       p.unit_price AS original_product_price,
       oi.id AS order_item_id,
       oi.unit_price AS snapshot_unit_price,
       o.id AS order_id,
       o.total_amount AS original_order_total
FROM products p
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM _order_management_price_snapshot) THEN
        RAISE EXCEPTION 'CHECK FAILED: no ordered product available for price snapshot test';
    END IF;
END;
$$;

BEGIN;
UPDATE products p
SET unit_price = p.unit_price + 1000
WHERE p.id IN (SELECT DISTINCT product_id FROM _order_management_price_snapshot);

DO $$
DECLARE
    snapshot_row record;
    current_price numeric(12, 2);
    current_item_price numeric(12, 2);
    current_total numeric(14, 2);
    current_line_sum numeric(14, 2);
    tested_count integer := 0;
BEGIN
    FOR snapshot_row IN SELECT * FROM _order_management_price_snapshot
    LOOP
        SELECT unit_price INTO current_price FROM products WHERE id = snapshot_row.product_id;
        SELECT unit_price INTO current_item_price FROM order_items WHERE id = snapshot_row.order_item_id;
        SELECT total_amount INTO current_total FROM orders WHERE id = snapshot_row.order_id;
        SELECT COALESCE(sum(quantity * unit_price), 0) INTO current_line_sum
        FROM order_items WHERE order_id = snapshot_row.order_id;

        IF current_price = snapshot_row.original_product_price THEN
            RAISE EXCEPTION 'CHECK FAILED: test product price did not change for product %', snapshot_row.product_id;
        END IF;
        IF current_item_price <> snapshot_row.snapshot_unit_price THEN
            RAISE EXCEPTION 'CHECK FAILED: order item % snapshot changed from % to %',
                snapshot_row.order_item_id, snapshot_row.snapshot_unit_price, current_item_price;
        END IF;
        IF current_total <> snapshot_row.original_order_total OR current_total <> current_line_sum THEN
            RAISE EXCEPTION 'CHECK FAILED: order % total changed or no longer matches line sum', snapshot_row.order_id;
        END IF;
        tested_count := tested_count + 1;
    END LOOP;
    RAISE NOTICE 'PASS price update did not alter % stored unit_price snapshot(s) or order total(s)', tested_count;
END;
$$;
ROLLBACK;

DO $$
DECLARE
    snapshot_row record;
    restored_count integer := 0;
    restored_price numeric(12, 2);
BEGIN
    FOR snapshot_row IN
        SELECT DISTINCT product_id, original_product_price
        FROM _order_management_price_snapshot
    LOOP
        SELECT unit_price INTO restored_price FROM products WHERE id = snapshot_row.product_id;
        IF restored_price <> snapshot_row.original_product_price THEN
            RAISE EXCEPTION 'CHECK FAILED: product % price expected restored value %, actual %',
                snapshot_row.product_id, snapshot_row.original_product_price, restored_price;
        END IF;
        restored_count := restored_count + 1;
    END LOOP;
    RAISE NOTICE 'PASS product price restored to original value for % product(s)', restored_count;
END;
$$;
DROP TABLE _order_management_price_snapshot;

DO $$
DECLARE
    artisan_row record;
    artisan_count integer;
    expected_artisans integer := 2;
BEGIN
    SELECT count(*) INTO artisan_count FROM artisans;
    IF artisan_count <> expected_artisans THEN
        RAISE EXCEPTION 'CHECK FAILED: expected % seeded artisans, found %', expected_artisans, artisan_count;
    END IF;

    FOR artisan_row IN
        SELECT expected.name,
               expected.revenue AS expected_revenue,
               expected.expenses AS expected_expenses,
               expected.net_profit AS expected_net_profit,
               COALESCE(revenue.amount, 0) AS actual_revenue,
               COALESCE(expenses.amount, 0) AS actual_expenses,
               COALESCE(revenue.amount, 0) - COALESCE(expenses.amount, 0) AS actual_net_profit
        FROM (VALUES
            ('Mithila Arts Collective'::text, 0::numeric, 600::numeric, -600::numeric),
            ('Sunita Devi'::text, 3600::numeric, 450::numeric, 3150::numeric)
        ) AS expected(name, revenue, expenses, net_profit)
        LEFT JOIN artisans a ON a.name = expected.name
        LEFT JOIN LATERAL (
            SELECT sum(oi.quantity * oi.unit_price) AS amount
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            JOIN products p ON p.id = oi.product_id
            WHERE p.artisan_id = a.id AND o.status <> 'CANCELLED'
        ) revenue ON true
        LEFT JOIN LATERAL (
            SELECT sum(e.amount) AS amount
            FROM expenses e
            WHERE e.artisan_id = a.id
        ) expenses ON true
    LOOP
        IF NOT EXISTS (SELECT 1 FROM artisans WHERE name = artisan_row.name) THEN
            RAISE EXCEPTION 'CHECK FAILED: seeded artisan % is missing', artisan_row.name;
        END IF;
        IF artisan_row.actual_revenue <> artisan_row.expected_revenue
           OR artisan_row.actual_expenses <> artisan_row.expected_expenses
           OR artisan_row.actual_net_profit <> artisan_row.expected_net_profit THEN
            RAISE EXCEPTION 'CHECK FAILED: artisan % expected revenue/expenses/profit %/%/%, actual %/%/%',
                artisan_row.name, artisan_row.expected_revenue, artisan_row.expected_expenses,
                artisan_row.expected_net_profit, artisan_row.actual_revenue,
                artisan_row.actual_expenses, artisan_row.actual_net_profit;
        END IF;
        RAISE NOTICE 'PASS profit for %: revenue % - expenses % = %',
            artisan_row.name, artisan_row.actual_revenue, artisan_row.actual_expenses,
            artisan_row.actual_net_profit;
    END LOOP;
END;
$$;
