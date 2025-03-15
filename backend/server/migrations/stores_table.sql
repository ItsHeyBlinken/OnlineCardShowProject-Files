-- Create stores table if it doesn't exist
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  store_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  customization JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS stores_user_id_idx ON stores(user_id);

-- First, let's check for problematic seller_profiles with NULL user_id
SELECT id, user_id, business_name 
FROM seller_profiles 
WHERE user_id IS NULL;

-- Insert a default record for each existing seller profile - BUT ONLY where user_id is NOT NULL
INSERT INTO stores (user_id, store_name, description, customization)
SELECT 
  sp.user_id, 
  COALESCE(sp.business_name, 'My Store') AS store_name, 
  sp.description, 
  '{
    "colorMode": "light",
    "viewMode": "grid",
    "bannerImage": null,
    "storeLogo": null,
    "backgroundColor": "#ffffff",
    "socialLinks": {
      "twitter": "",
      "instagram": "",
      "facebook": ""
    }
  }'::jsonb
FROM seller_profiles sp
LEFT JOIN stores s ON sp.user_id = s.user_id
WHERE s.user_id IS NULL
  AND sp.user_id IS NOT NULL;  -- Only select records that have a valid user_id

-- Output message
SELECT 'Stores table created or updated successfully' as message; 