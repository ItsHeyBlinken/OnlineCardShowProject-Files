const express = require('express');
const router = express.Router();
const { getFeaturedSellers, getTopSellers, getDeals } = require('../controllers/sellersController');

// Featured sellers route
router.get('/featured', getFeaturedSellers);

// Top sellers route
router.get('/top', getTopSellers);

// Deals route
router.get('/deals', getDeals);

module.exports = router;
