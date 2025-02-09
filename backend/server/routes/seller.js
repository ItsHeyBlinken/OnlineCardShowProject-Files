const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
    getDashboardStats, 
    getSellerListings, 
    getSellerOrders 
} = require('../controllers/sellerController');

// Add debug logging
router.get('/dashboard-stats', auth, (req, res, next) => {
    console.log('Hitting dashboard-stats endpoint');
    console.log('User from token:', req.user);
    getDashboardStats(req, res, next);
});

router.get('/listings', auth, (req, res, next) => {
    console.log('Hitting seller listings endpoint');
    getSellerListings(req, res, next);
});

router.get('/orders', auth, (req, res, next) => {
    console.log('Hitting seller orders endpoint');
    getSellerOrders(req, res, next);
});

// Create new listing
router.post('/listings', auth, async (req, res) => {
    try {
        const { title, description, price, category, image_url } = req.body;
        const sellerId = req.user.id;

        const result = await pool.query(
            `INSERT INTO listings (seller_id, title, description, price, category, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [sellerId, title, description, price, category, image_url]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update listing
router.put('/listings/:id', auth, async (req, res) => {
    try {
        const { title, description, price, category, image_url } = req.body;
        const listingId = req.params.id;
        const sellerId = req.user.id;

        const result = await pool.query(
            `UPDATE listings 
             SET title = $1, description = $2, price = $3, category = $4, image_url = $5
             WHERE id = $6 AND seller_id = $7
             RETURNING *`,
            [title, description, price, category, image_url, listingId, sellerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Listing not found or unauthorized' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating listing:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete listing
router.delete('/listings/:id', auth, async (req, res) => {
    try {
        const listingId = req.params.id;
        const sellerId = req.user.id;

        const result = await pool.query(
            'DELETE FROM listings WHERE id = $1 AND seller_id = $2 RETURNING *',
            [listingId, sellerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Listing not found or unauthorized' });
        }

        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        console.error('Error deleting listing:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update order status
router.put('/orders/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;
        const sellerId = req.user.id;

        const result = await pool.query(`
            UPDATE orders o
            SET status = $1
            FROM listings l
            WHERE o.listing_id = l.id
            AND l.seller_id = $2
            AND o.id = $3
            RETURNING o.*, l.title as listing_title`,
            [status, sellerId, orderId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found or unauthorized' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 