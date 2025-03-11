require('dotenv').config();

// Verify the secret is loaded
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const app = express();
const auth = require('./middleware/auth');
const { authenticateToken } = require('./middleware/authMiddleware');
const pool = require('./db');
const fs = require('fs');
const path = require('path');
const { s3, getPublicUrl } = require('./config/s3Config');

// Run database migrations
const runDatabaseMigrations = async () => {
  try {
    console.log('Running database schema migrations...');
    
    // Step 1: Run existing migrations for listings
    try {
      const schemaUpdateSQL = fs.readFileSync(path.join(__dirname, 'sql', 'update_listings_schema.sql'), 'utf8');
      await pool.query(schemaUpdateSQL);
      console.log('Successfully ran listings schema update');
    } catch (listingsError) {
      console.error('Error running listings schema migration:', listingsError);
      // Continue with other migrations even if this one fails
    }
    
    // Step 2: Add image_url column if needed
    try {
      const addImageUrlColumn = fs.readFileSync(path.join(__dirname, 'sql', 'add_image_url_column.sql'), 'utf8');
      await pool.query(addImageUrlColumn);
      console.log('Added image_url column to users table if not present');
    } catch (migrationError) {
      console.error('Error running image_url column migration:', migrationError);
      // Continue with other migrations
    }
    
    // Step 3: Update orders tables for tax information
    try {
      // First update the orders table to add tax columns if they don't exist
      const updateOrdersTableSQL = `
        -- Add tax columns to orders table if they don't exist
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
            ALTER TABLE orders ADD COLUMN subtotal NUMERIC DEFAULT 0;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_amount') THEN
            ALTER TABLE orders ADD COLUMN tax_amount NUMERIC DEFAULT 0;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_rate') THEN
            ALTER TABLE orders ADD COLUMN tax_rate NUMERIC(6, 4);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_info') THEN
            ALTER TABLE orders ADD COLUMN shipping_info JSONB;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_id') THEN
            ALTER TABLE orders ADD COLUMN payment_id VARCHAR(255);
          END IF;
        END
        $$;
      `;
      
      await pool.query(updateOrdersTableSQL);
      console.log('Updated orders table with tax columns if needed');
      
      // Create indexes if they don't exist
      const createIndexesSQL = `
        -- Add indexes for better performance if they don't exist
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_buyer_id') THEN
            CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_order_id') THEN
            CREATE INDEX idx_order_items_order_id ON order_items(order_id);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_listing_id') THEN
            CREATE INDEX idx_order_items_listing_id ON order_items(listing_id);
          END IF;
        END
        $$;
      `;
      
      await pool.query(createIndexesSQL);
      console.log('Created indexes for orders and order_items tables if needed');
      
    } catch (ordersError) {
      console.error('Error updating orders tables:', ordersError);
    }
    
    // Step 4: Add seller shipping preferences
    try {
      const addSellerShippingPreferences = fs.readFileSync(path.join(__dirname, 'sql', 'add_seller_shipping_preferences.sql'), 'utf8');
      await pool.query(addSellerShippingPreferences);
      console.log('Added seller shipping preferences columns if not present');
    } catch (sellerShippingError) {
      console.error('Error adding seller shipping preferences:', sellerShippingError);
    }
    
    // Step 5: Add user shipping addresses table
    try {
      const createUserShippingAddresses = fs.readFileSync(path.join(__dirname, 'sql', 'create_user_shipping_addresses.sql'), 'utf8');
      await pool.query(createUserShippingAddresses);
      console.log('Created user shipping addresses table if not present');
    } catch (shippingAddressesError) {
      console.error('Error creating user shipping addresses table:', shippingAddressesError);
    }
    
    // Step 6: Add is_paid column to orders table
    try {
      const addIsPaidColumn = fs.readFileSync(path.join(__dirname, 'sql', 'add_is_paid_to_orders.sql'), 'utf8');
      await pool.query(addIsPaidColumn);
      console.log('Added is_paid column to orders table if not present');
    } catch (isPaidColumnError) {
      console.error('Error adding is_paid column to orders table:', isPaidColumnError);
    }
    
    console.log('Database schema migrations completed successfully');
  } catch (error) {
    console.error('Error running database migrations:', error);
  }
};

// Import routes
const signupRoutes = require('./routes/signup');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const searchRoutes = require('./routes/search');
const cartRoutes = require('./routes/cart');
const listingsRoutes = require('./routes/listings');
const sellerRoutes = require('./routes/seller');
const storesRoutes = require('./routes/stores');
const sellersRouter = require('./routes/sellers'); // Adjust the path as necessary
const messagesRouter = require('./routes/messages');
const imageRoutes = require('./routes/images'); // Add the new image routes
const paymentRoutes = require('./routes/payments'); // Add payment routes
const shippingRoutes = require('./routes/shipping');

// Middleware
app.use(cors());

// Special middleware for Stripe webhook endpoint - it must come BEFORE express.json()
// This ensures the webhook data is properly parsed as raw binary data
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for all other routes
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/listings', listingsRoutes);
app.use('/api', signupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', searchRoutes);
app.use('/api', cartRoutes);
app.use('/api/seller', auth, sellerRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/sellers', sellersRouter); // This will prefix all routes in sellersRouter with /api/sellers
app.use('/api/messages', messagesRouter);
app.use('/api/images', imageRoutes); // Add the image routes
app.use('/api/payments', paymentRoutes); // Add payment routes
app.use('/api/shipping', shippingRoutes);

// Simple route to test S3 access
app.get('/api/test-s3', async (req, res) => {
  try {
    const bucketParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME
    };
    
    // List objects in the bucket
    const data = await s3.listObjectsV2(bucketParams).promise();
    
    if (data.Contents && data.Contents.length > 0) {
      // Get first image in the bucket
      const firstImage = data.Contents[0];
      
      // Generate a signed URL for the image
      const signedUrl = getPublicUrl(firstImage.Key);
      
      res.json({
        message: 'S3 connection successful',
        objectCount: data.Contents.length,
        firstKey: firstImage.Key,
        signedUrl
      });
    } else {
      res.json({
        message: 'S3 connection successful but bucket is empty',
        objectCount: 0
      });
    }
  } catch (error) {
    console.error('S3 test error:', error);
    res.status(500).json({ message: 'S3 connection failed', error: error.message });
  }
});

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);
  
  // Run database migrations when the server starts
  await runDatabaseMigrations();
}).on('error', (err) => {
  console.error('Failed to start server:', err);
});

module.exports = app;
