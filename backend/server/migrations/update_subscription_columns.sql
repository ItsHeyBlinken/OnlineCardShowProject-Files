-- Add subscription related columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'Basic';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP;

-- Add subscription related columns to seller_profiles if they don't exist
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'Basic';
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT false;

-- Fix existing data - update active subscriptions
UPDATE users 
SET subscription_status = 'active' 
WHERE subscription_id IS NOT NULL 
  AND subscription_tier != 'Basic';

-- Log migration results for debugging  
SELECT 
  (SELECT COUNT(*) FROM users WHERE subscription_tier IS NOT NULL) AS users_with_subscription_tier,
  (SELECT COUNT(*) FROM users WHERE subscription_status = 'active') AS users_with_active_subscription,
  (SELECT COUNT(*) FROM seller_profiles WHERE subscription_tier IS NOT NULL) AS seller_profiles_with_subscription_tier; 