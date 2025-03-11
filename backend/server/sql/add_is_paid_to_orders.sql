-- Add is_paid column to orders table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'is_paid') THEN
    ALTER TABLE orders ADD COLUMN is_paid BOOLEAN DEFAULT FALSE;
  END IF;
END
$$;

-- Create index for faster lookups on is_paid column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_is_paid') THEN
    CREATE INDEX idx_orders_is_paid ON orders(is_paid);
  END IF;
END
$$; 