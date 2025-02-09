const express = require('express');
const router = express.Router();

// Mock cart handler
router.get('/cart', (req, res) => {
  console.log('Fetching cart items');
  // Implement cart logic here
  res.json({ items: [] }); // Return mock cart items
});

module.exports = router; 