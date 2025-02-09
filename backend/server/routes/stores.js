const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get dashboard stats
router.get('/dashboard', auth, async (req, res) => {
    try {
        const sellerId = req.user.id;
        console.log('Getting dashboard stats for seller:', sellerId);
        
        // Get active listings count
        const listingsResult = await pool.query(
            'SELECT COUNT(*) as active_listings FROM listings WHERE seller_id = $1',
            [sellerId]
        );

        // Get sales stats
        const salesResult = await pool.query(`
            SELECT 
                COALESCE(COUNT(*), 0) as total_orders,
                COALESCE(SUM(price_at_purchase), 0) as total_sales,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
            FROM orders o
            JOIN listings l ON o.listing_id = l.id
            WHERE l.seller_id = $1`,
            [sellerId]
        );

        const stats = {
            activeListings: parseInt(listingsResult.rows[0].active_listings),
            totalSales: parseFloat(salesResult.rows[0].total_sales || 0),
            totalOrders: parseInt(salesResult.rows[0].total_orders),
            pendingOrders: parseInt(salesResult.rows[0].pending_orders || 0)
        };

        console.log('Sending stats:', stats);
        res.json(stats);

    } catch (error) {
        console.error('Error in dashboard route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add listings route
router.get('/dashboard/listings', auth, async (req, res) => {
    try {
        const sellerId = req.user.id;
        console.log('Getting listings for seller:', sellerId);

        const result = await pool.query(
            'SELECT * FROM listings WHERE seller_id = $1 ORDER BY created_at DESC',
            [sellerId]
        );

        console.log('Found listings:', result.rows.length);
        res.json(result.rows);

    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 