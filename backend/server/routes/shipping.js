const express = require('express');
const router = express.Router();
const { 
  getShippingMethods, 
  calculateShippingCost,
  getSellerShippingPolicy,
  updateSellerShippingPolicy
} = require('../controllers/shippingController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Route to get all available shipping methods
router.get('/methods', getShippingMethods);

// Route to calculate shipping cost
router.post('/calculate', calculateShippingCost);

// Route to get a seller's shipping policy
router.get('/policy/:sellerId', getSellerShippingPolicy);

// Route to update a seller's shipping policy (requires authentication)
router.put('/policy/:sellerId', authenticateToken, updateSellerShippingPolicy);

module.exports = router; 