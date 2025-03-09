-- Add shipping preference columns to seller_profiles table
DO $$
BEGIN
  -- Add offers_free_shipping column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'offers_free_shipping') THEN
    ALTER TABLE seller_profiles ADD COLUMN offers_free_shipping BOOLEAN DEFAULT false;
  END IF;
  
  -- Add standard_shipping_fee column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'standard_shipping_fee') THEN
    ALTER TABLE seller_profiles ADD COLUMN standard_shipping_fee NUMERIC DEFAULT 0;
  END IF;
  
  -- Add shipping_policy column if it doesn't exist (to store text description of shipping policy)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'shipping_policy') THEN
    ALTER TABLE seller_profiles ADD COLUMN shipping_policy TEXT;
  END IF;
  
  -- Add uses_calculated_shipping column if it doesn't exist (to determine if we should use weight-based calculation)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'uses_calculated_shipping') THEN
    ALTER TABLE seller_profiles ADD COLUMN uses_calculated_shipping BOOLEAN DEFAULT false;
  END IF;
END
$$; 