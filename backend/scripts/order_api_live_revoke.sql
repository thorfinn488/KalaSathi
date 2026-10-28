-- Run only when approved, while connected to kalasathi.
-- Keep the read access required by the service; remove all other table grants.
BEGIN;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM order_api;
GRANT SELECT ON TABLE public.products, public.ai_insights, public.v_low_stock TO order_api;
REVOKE EXECUTE ON FUNCTION public.fn_place_order(uuid, jsonb) FROM order_api;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    REVOKE SELECT ON TABLES FROM order_api;

COMMIT;
