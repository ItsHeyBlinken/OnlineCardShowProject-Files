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

async function verifyColumn() {
  try {
    console.log('Connecting to database to verify columns...');
    
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY column_name
    `);
    
    console.log('Columns in users table:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}`);
    });
    
    const hasStripeConnectId = result.rows.some(row => row.column_name === 'stripe_connect_id');
    console.log(`stripe_connect_id column exists: ${hasStripeConnectId}`);
    
  } catch (error) {
    console.error('Error verifying column:', error);
  } finally {
    await pool.end();
  }
}

verifyColumn(); 