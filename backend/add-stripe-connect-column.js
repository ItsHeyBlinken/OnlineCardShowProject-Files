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

async function addStripeConnectColumn() {
  console.log('Starting stripe_connect_id column migration...');
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if the column already exists
      const checkColumnResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'stripe_connect_id'
      `);
      
      if (checkColumnResult.rows.length > 0) {
        console.log('Column stripe_connect_id already exists, skipping migration.');
      } else {
        console.log('Adding stripe_connect_id column to users table...');
        
        // Add the stripe_connect_id column
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN stripe_connect_id VARCHAR(255) DEFAULT NULL
        `);
        
        console.log('Added stripe_connect_id column successfully!');
        
        // Add comment to explain the column
        await client.query(`
          COMMENT ON COLUMN users.stripe_connect_id IS 'Stores the Stripe Connect account ID for sellers who want to receive payments'
        `);
        
        console.log('Added comment to stripe_connect_id column.');
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Migration completed successfully!');
      
    } catch (error) {
      // If any error occurs, rollback the transaction
      await client.query('ROLLBACK');
      console.error('Error during transaction:', error);
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
addStripeConnectColumn(); 