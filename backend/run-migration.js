const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT
});

// Log connection info for debugging (don't log password in production)
console.log('Trying to connect with:');
console.log(`  User: ${process.env.DB_USER}`);
console.log(`  Host: ${process.env.DB_HOST}`);
console.log(`  Database: ${process.env.DB_NAME}`);
console.log(`  Port: ${process.env.DB_PORT}`);

async function runMigration() {
  console.log('Starting stores table migration...');
  
  try {
    const migrationFilePath = path.join(__dirname, 'server', 'migrations', 'stores_table.sql');
    const sql = fs.readFileSync(migrationFilePath, 'utf8');
    
    console.log('Executing SQL migration...');
    
    // Execute the SQL script as a series of statements
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Create the table and index first (these are independent)
      console.log('Creating the stores table and index...');
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS stores (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          store_name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          customization JSONB DEFAULT '{}'::jsonb
        );
        
        CREATE INDEX IF NOT EXISTS stores_user_id_idx ON stores(user_id);
      `;
      await client.query(createTableSQL);
      
      // Check for problematic records
      console.log('Checking for seller profiles with NULL user_id...');
      const checkResult = await client.query(`
        SELECT id, user_id, business_name 
        FROM seller_profiles 
        WHERE user_id IS NULL
      `);
      
      if (checkResult.rows.length > 0) {
        console.warn('Found seller profiles with NULL user_id:');
        console.table(checkResult.rows);
      } else {
        console.log('No seller profiles with NULL user_id found.');
      }
      
      // Insert records with proper conditions
      console.log('Inserting store records...');
      const insertSQL = `
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
          AND sp.user_id IS NOT NULL
      `;
      const insertResult = await client.query(insertSQL);
      console.log(`Inserted ${insertResult.rowCount} store records.`);
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('Migration completed successfully!');
      
    } catch (error) {
      // If any error occurs, rollback the transaction
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release the client
      client.release();
    }
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration
runMigration(); 