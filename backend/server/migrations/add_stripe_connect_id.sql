-- Add stripe_connect_id column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_connect_id VARCHAR(255) DEFAULT NULL;

-- Add comment to explain the purpose of this column
COMMENT ON COLUMN users.stripe_connect_id IS 'Stores the Stripe Connect account ID for sellers who want to receive payments'; 