-- Add indexes for better query performance
DO $$
BEGIN
    -- Index for orders table
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_buyer_created') THEN
        CREATE INDEX idx_orders_buyer_created ON orders(buyer_id, created_at DESC);
    END IF;

    -- Index for order items table
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_order_listing') THEN
        CREATE INDEX idx_order_items_order_listing ON order_items(order_id, listing_id);
    END IF;
END
$$; 