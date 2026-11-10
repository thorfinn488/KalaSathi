-- KalaSaathi Production PostgreSQL Schema

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ARTISAN', 'ADMIN', 'BUYER')),
    region VARCHAR(255),
    craft_specialty VARCHAR(255),
    company_name VARCHAR(255),
    requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(64) PRIMARY KEY,
    artisan_id VARCHAR(64) REFERENCES users(user_id) ON DELETE SET NULL,
    artisan_name VARCHAR(255),
    region VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'READY' CHECK (status IN ('DRAFT', 'PROCESSING', 'READY', 'PUBLISHED', 'FAILED')),
    image_url TEXT,
    heritage_story TEXT,
    moq INTEGER DEFAULT 10,
    lead_time_days INTEGER DEFAULT 14,
    catalogue JSONB,
    price JSONB,
    pricing JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(product_id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    artisan_name VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    shipping_address TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'UPI',
    payment_status VARCHAR(20) DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'ESCROW_HELD', 'PENDING')),
    delivery_status VARCHAR(20) DEFAULT 'CRAFTING' CHECK (delivery_status IN ('CRAFTING', 'QUALITY_CHECK', 'SHIPPED', 'DELIVERED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS opportunities (
    opportunity_id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(product_id) ON DELETE SET NULL,
    buyer_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    match_score INTEGER DEFAULT 90,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    requirement TEXT NOT NULL,
    quantity INTEGER DEFAULT 50,
    budget VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_opportunities_product ON opportunities(product_id);
