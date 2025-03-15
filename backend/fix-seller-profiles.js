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

async function fixSellerProfiles() {
  console.log('Starting to fix seller_profiles with NULL user_id...');
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Find seller_profiles with NULL user_id
    const checkResult = await client.query(`
      SELECT id, user_id, business_name, description 
      FROM seller_profiles 
      WHERE user_id IS NULL
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('No seller profiles with NULL user_id found. Nothing to fix.');
      await client.query('COMMIT');
      return;
    }
    
    console.log(`Found ${checkResult.rows.length} seller profiles with NULL user_id:`);
    console.table(checkResult.rows);
    
    // For each NULL user_id record, we have two options:
    // 1. Try to find an appropriate user to associate it with
    // 2. Remove the record if it's invalid/orphaned data
    
    // Option 1: For this example, we'll try to associate with users where name matches business_name
    // This is a heuristic approach - you may want to customize this based on your data
    for (const profile of checkResult.rows) {
      // Skip if no business name to match on
      if (!profile.business_name) continue;
      
      // Try to find a user with a similar name
      const matchResult = await client.query(`
        SELECT id, name, email 
        FROM users 
        WHERE name ILIKE $1 
        LIMIT 1
      `, [`%${profile.business_name}%`]);
      
      if (matchResult.rows.length > 0) {
        const userId = matchResult.rows[0].id;
        console.log(`Associating seller profile ID ${profile.id} with user ID ${userId} (${matchResult.rows[0].name})`);
        
        await client.query(`
          UPDATE seller_profiles 
          SET user_id = $1 
          WHERE id = $2
        `, [userId, profile.id]);
      }
    }
    
    // Check if there are any remaining profiles with NULL user_id
    const remainingResult = await client.query(`
      SELECT id FROM seller_profiles WHERE user_id IS NULL
    `);
    
    if (remainingResult.rows.length > 0) {
      console.log(`Removing ${remainingResult.rows.length} orphaned seller profiles that couldn't be associated with users`);
      
      // Option 2: Remove orphaned records that couldn't be associated
      await client.query(`
        DELETE FROM seller_profiles WHERE user_id IS NULL
      `);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Successfully fixed seller_profiles table!');
    
  } catch (error) {
    // If any error occurs, rollback the transaction
    await client.query('ROLLBACK');
    console.error('Error fixing seller profiles:', error);
  } finally {
    // Release the client
    client.release();
    // Close the pool
    await pool.end();
  }
}

// Run the fix
fixSellerProfiles(); 