-- One-time least-privilege role setup for the separate order API.
-- PostgreSQL trust auth on 127.0.0.1 ignores this password for local connections.
-- It is still set for clients that authenticate with a password.

\set ON_ERROR_STOP on
SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'order_api') AS order_api_exists \gset
\if :order_api_exists
ALTER ROLE order_api
    WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
    NOINHERIT NOREPLICATION NOBYPASSRLS;
\else
CREATE ROLE order_api
    WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
    NOINHERIT NOREPLICATION NOBYPASSRLS;
\endif
\password order_api
\i scripts/order_api_grants.sql
