const express = require('express');
const router = express.Router();
const { getFeaturedSellers, getTopSellers } = require('../controllers/sellersController');
const db = require('../db'); // Adjust the path to your database module

// Endpoint to fetch featured sellers
router.get('/featured', getFeaturedSellers);

// Endpoint to fetch deals and steals
router.get('/deals', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        l.id,
        l.title,
        l.price,
        l.image_url as image,
        u.username as seller,
        20 as discount
      FROM listings l
      JOIN users u ON l.seller_id = u.id
      WHERE l.price <= 50
      ORDER BY l.created_at DESC
      LIMIT 2
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to fetch top sellers
router.get('/top', getTopSellers);

module.exports = router;
