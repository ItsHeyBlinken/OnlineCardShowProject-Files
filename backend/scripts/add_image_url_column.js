require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('Adding image_url column to users table...');
    
    // Execute SQL directly
    await pool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'users' 
              AND column_name = 'image_url'
          ) THEN
              ALTER TABLE users ADD COLUMN image_url TEXT;
              RAISE NOTICE 'Added image_url column to users table';
          ELSE
              RAISE NOTICE 'image_url column already exists';
          END IF;
      END $$;
    `);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration(); 