-- Run while connected to kalasathi_test, after order_management_demo.sql.
-- PostgreSQL default table grants cannot be scoped by table name, so future tables
-- receive SELECT only; the precise DML grants below are reapplied after each reset.
REVOKE ALL PRIVILEGES ON DATABASE kalasathi_test FROM order_api;
GRANT CONNECT ON DATABASE kalasathi_test TO order_api;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM order_api;
GRANT USAGE ON SCHEMA public TO order_api;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM order_api;

GRANT SELECT ON TABLE
    public.crafts, public.artisans, public.customers, public.ai_insights,
    public.v_low_stock
TO order_api;
GRANT SELECT, INSERT, UPDATE ON TABLE public.products, public.orders TO order_api;
GRANT SELECT, INSERT ON TABLE public.order_items, public.expenses TO order_api;

REVOKE ALL PRIVILEGES ON FUNCTION public.fn_place_order(uuid, jsonb) FROM order_api;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_place_order(uuid, jsonb) TO order_api;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT SELECT ON TABLES TO order_api;
