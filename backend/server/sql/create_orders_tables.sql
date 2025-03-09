-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(6, 4),
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    shipping_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Add tax columns to orders table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
    ALTER TABLE orders ADD COLUMN subtotal NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_amount') THEN
    ALTER TABLE orders ADD COLUMN tax_amount NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_rate') THEN
    ALTER TABLE orders ADD COLUMN tax_rate NUMERIC(6, 4);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_info') THEN
    ALTER TABLE orders ADD COLUMN shipping_info JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_id') THEN
    ALTER TABLE orders ADD COLUMN payment_id VARCHAR(255);
  END IF;
END
$$;

-- Add indexes for better performance if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_buyer_id') THEN
    CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_order_id') THEN
    CREATE INDEX idx_order_items_order_id ON order_items(order_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_listing_id') THEN
    CREATE INDEX idx_order_items_listing_id ON order_items(listing_id);
  END IF;
END
$$; 