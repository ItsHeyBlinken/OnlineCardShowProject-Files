-- Add image_url column to users table if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE users ADD COLUMN image_url TEXT;
    END IF;
END $$; 