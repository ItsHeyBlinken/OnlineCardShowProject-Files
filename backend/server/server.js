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

// Run database migrations
const runDatabaseMigrations = async () => {
  try {
    console.log('Running database schema migrations...');
    const schemaUpdateSQL = fs.readFileSync(path.join(__dirname, 'sql', 'update_listings_schema.sql'), 'utf8');
    await pool.query(schemaUpdateSQL);
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
