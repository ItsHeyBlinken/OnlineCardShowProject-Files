const express = require('express');
const router = express.Router();
const { getFeaturedSellers, getTopSellers, getDeals, getRecentListings } = require('../controllers/sellersController');

// Featured sellers route
router.get('/featured', getFeaturedSellers);

// Top sellers route
router.get('/top', getTopSellers);

// Deals route
router.get('/deals', getDeals);

// Recent listings route
router.get('/recent', getRecentListings);

module.exports = router;
