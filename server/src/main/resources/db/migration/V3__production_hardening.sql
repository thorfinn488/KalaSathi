-- V3 Production Hardening: Webhook idempotency and performance indexes

CREATE TABLE IF NOT EXISTS processed_webhook_events (
    event_id VARCHAR(128) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    gateway_order_id VARCHAR(128),
    payment_id VARCHAR(128),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_processed_webhook_order_id
    ON processed_webhook_events(gateway_order_id);

CREATE INDEX IF NOT EXISTS idx_products_artisan_id
    ON products(artisan_id);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
    ON orders(created_at DESC);
