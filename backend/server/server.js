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
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
});

module.exports = app;
