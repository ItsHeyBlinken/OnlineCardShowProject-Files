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
  console.log('Starting subscription columns migration...');
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Migration file paths
      const migrationFiles = [
        path.join(__dirname, 'server', 'migrations', 'update_subscription_columns.sql'),
        path.join(__dirname, 'server', 'migrations', 'add_pending_subscription_tier.sql'),
        path.join(__dirname, 'server', 'migrations', 'add_stripe_connect_id.sql')
      ];
      
      for (let i = 0; i < migrationFiles.length; i++) {
        const migrationFilePath = migrationFiles[i];
        const sql = fs.readFileSync(migrationFilePath, 'utf8');
        
        console.log(`Executing migration file ${i + 1} of ${migrationFiles.length}:`);
        console.log(migrationFilePath);
        
        // Split SQL into individual statements and execute each one
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (let j = 0; j < statements.length; j++) {
          const stmt = statements[j];
          console.log(`Executing statement ${j + 1} of ${statements.length}:`);
          console.log(stmt.substring(0, 100) + '...'); // Log just the beginning of the statement
          
          try {
            const result = await client.query(stmt);
            if (result.command === 'SELECT') {
              console.log(`Statement executed successfully: ${result.command} ${result.rows.length} rows`);
            } else {
              console.log(`Statement executed successfully: ${result.command} ${result.rowCount || 0} rows`);
            }
          } catch (error) {
            // Log error details
            console.error(`Error executing statement ${j + 1}:`, error.message);
            throw error;
          }
        }
      }
      
      // Commit transaction
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