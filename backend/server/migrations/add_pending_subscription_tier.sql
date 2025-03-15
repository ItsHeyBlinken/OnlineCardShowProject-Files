-- Add pending_subscription_tier column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pending_subscription_tier VARCHAR(50) DEFAULT NULL;

-- Update existing users to have NULL pending_subscription_tier
UPDATE users
SET pending_subscription_tier = NULL
WHERE pending_subscription_tier IS NOT NULL;

-- Add comment to explain the purpose of this column
COMMENT ON COLUMN users.pending_subscription_tier IS 'Stores the tier that a user will be downgraded to at the end of their current billing period'; 