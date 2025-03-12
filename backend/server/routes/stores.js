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
        
        // Get Stripe Connect status
        const stripeResult = await pool.query(
            'SELECT stripe_account_id FROM seller_profiles WHERE user_id = $1',
            [sellerId]
        );
        
        const stripeConnected = stripeResult.rows.length > 0 && !!stripeResult.rows[0].stripe_account_id;

        const stats = {
            activeListings: parseInt(listingsResult.rows[0].active_listings),
            totalSales: parseFloat(salesResult.rows[0].total_sales || 0),
            totalOrders: parseInt(salesResult.rows[0].total_orders),
            pendingOrders: parseInt(salesResult.rows[0].pending_orders || 0),
            stripeConnected: stripeConnected
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

// Get store customization
router.get('/:storeId', async (req, res) => {
    try {
        const { storeId } = req.params;
        console.log('Getting store customization for store:', storeId);

        // Check if store exists
        const storeResult = await pool.query(
            'SELECT * FROM stores WHERE id = $1',
            [storeId]
        );

        if (storeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Get customization
        const customizationResult = await pool.query(
            'SELECT customization FROM stores WHERE id = $1',
            [storeId]
        );

        const store = storeResult.rows[0];
        const customization = customizationResult.rows[0]?.customization || {};

        res.json({
            store,
            customization
        });

    } catch (error) {
        console.error('Error fetching store customization:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update store customization
router.put('/:storeId', auth, async (req, res) => {
    try {
        const { storeId } = req.params;
        const { customization } = req.body;
        const userId = req.user.id;

        console.log('Updating store customization for store:', storeId);

        // Check if user owns the store
        const storeResult = await pool.query(
            'SELECT * FROM stores WHERE id = $1 AND user_id = $2',
            [storeId, userId]
        );

        if (storeResult.rows.length === 0) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Update customization
        const updateResult = await pool.query(
            'UPDATE stores SET customization = $1 WHERE id = $2 RETURNING *',
            [customization, storeId]
        );

        res.json({
            store: updateResult.rows[0],
            customization
        });

    } catch (error) {
        console.error('Error updating store customization:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 