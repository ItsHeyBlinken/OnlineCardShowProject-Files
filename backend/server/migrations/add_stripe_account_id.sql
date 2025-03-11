-- Add stripe_account_id column to seller_profiles table
ALTER TABLE seller_profiles
ADD COLUMN stripe_account_id VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX idx_seller_profiles_stripe_account_id ON seller_profiles(stripe_account_id); 