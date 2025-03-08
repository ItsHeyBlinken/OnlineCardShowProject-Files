-- Check if image_urls column exists. If not, add it.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='listings' AND column_name='image_urls'
    ) THEN
        -- Add image_urls column as a JSONB array to store multiple URLs
        ALTER TABLE listings ADD COLUMN image_urls JSONB DEFAULT '[]'::jsonb;
        
        -- Copy existing single image_url values to the new image_urls array
        UPDATE listings
        SET image_urls = jsonb_build_array(image_url)
        WHERE image_url IS NOT NULL AND image_url != '';
    END IF;
END
$$;

-- Check if image_url column exists in users table. If not, add it.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='image_url'
    ) THEN
        -- Add image_url column to users table
        ALTER TABLE users ADD COLUMN image_url TEXT;
    END IF;
END
$$; 