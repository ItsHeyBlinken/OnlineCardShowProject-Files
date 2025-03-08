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
const pool = require('./db');
const fs = require('fs');
const path = require('path');
const { s3, getPublicUrl } = require('./config/s3Config');

// Run database migrations
const runDatabaseMigrations = async () => {
  try {
    console.log('Running database schema migrations...');
    
    // Run existing migrations
    const schemaUpdateSQL = fs.readFileSync(path.join(__dirname, 'sql', 'update_listings_schema.sql'), 'utf8');
    await pool.query(schemaUpdateSQL);
    
    // Run the new migration to add image_url column
    try {
      const addImageUrlColumn = fs.readFileSync(path.join(__dirname, 'sql', 'add_image_url_column.sql'), 'utf8');
      await pool.query(addImageUrlColumn);
      console.log('Added image_url column to users table if not present');
    } catch (migrationError) {
      console.error('Error running image_url column migration:', migrationError);
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

// Middleware
app.use(cors());
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
