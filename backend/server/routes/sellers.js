const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust the path to your database module

// Endpoint to fetch featured sellers
router.get('/featured', async (req, res) => {
  try {
    const featuredSellers = await db.query('SELECT * FROM sellers WHERE featured = true'); // Adjust query as needed
    res.json(featuredSellers);
  } catch (error) {
    console.error('Error fetching featured sellers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to fetch deals and steals
router.get('/deals', async (req, res) => {
  try {
    const deals = await db.query('SELECT * FROM deals'); // Adjust query as needed
    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to fetch top sellers
router.get('/top', async (req, res) => {
  try {
    const topSellers = await db.query('SELECT * FROM sellers ORDER BY sales DESC LIMIT 10'); // Adjust query as needed
    res.json(topSellers);
  } catch (error) {
    console.error('Error fetching top sellers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
