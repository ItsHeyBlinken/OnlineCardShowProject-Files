const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get dashboard stats
router.get('/dashboard', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch user data
        const userResult = await pool.query(
            'SELECT id, username, email, subscription_tier, subscription_id FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.rows[0];
        const subscriptionTier = user.subscription_tier || 'Basic';

        // Calculate max listings based on tier
        let maxListings;
        switch (subscriptionTier) {
            case 'Starter': maxListings = 250; break;
            case 'Pro': maxListings = 750; break;
            case 'Premium': maxListings = 999999; break;
            default: maxListings = 75; // Basic
        }

        // Fetch active listings count
        const listingsResult = await pool.query(
            'SELECT COUNT(*) FROM listings WHERE seller_id = $1',
            [userId]
        );

        const activeListings = parseInt(listingsResult.rows[0].count) || 0;

        // Prepare stats to send
        const stats = {
            activeListings,
            totalSales: 0, // Replace with actual calculation
            totalOrders: 0, // Replace with actual calculation
            pendingOrders: 0, // Replace with actual calculation
            stripeConnected: false, // Replace with actual value
            subscriptionTier,
            maxListings,
            subscription_id: user.subscription_id
        };

        console.log('Sending dashboard stats:', stats);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to get max listings
function getMaxListings(tier) {
    switch (tier) {
        case 'Basic': return 75;
        case 'Starter': return 250;
        case 'Pro': return 750;
        case 'Premium': return 999999; // Effectively unlimited
        default: return 75;
    }
}

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