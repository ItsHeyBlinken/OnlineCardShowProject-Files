const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db');
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
        const { 
            title, 
            description, 
            price, 
            category, 
            image_url, 
            image_urls,
            condition,
            year,
            brand,
            playerName,
            cardNumber
        } = req.body;
        
        const listingId = req.params.id;
        const sellerId = req.user.id;

        // Convert image_urls array to JSONB if provided
        const imageUrlsJson = image_urls ? JSON.stringify(image_urls) : null;

        // Build the query dynamically based on provided fields
        let updateFields = [];
        let queryParams = [];
        let paramIndex = 1;

        if (title !== undefined) {
            updateFields.push(`title = $${paramIndex++}`);
            queryParams.push(title);
        }

        if (description !== undefined) {
            updateFields.push(`description = $${paramIndex++}`);
            queryParams.push(description);
        }

        if (price !== undefined) {
            updateFields.push(`price = $${paramIndex++}`);
            queryParams.push(price);
        }

        if (category !== undefined) {
            updateFields.push(`category = $${paramIndex++}`);
            queryParams.push(category);
        }

        if (condition !== undefined) {
            updateFields.push(`condition = $${paramIndex++}`);
            queryParams.push(condition);
        }

        if (image_url !== undefined) {
            updateFields.push(`image_url = $${paramIndex++}`);
            queryParams.push(image_url);
        }

        if (imageUrlsJson !== null) {
            updateFields.push(`image_urls = $${paramIndex++}`);
            queryParams.push(imageUrlsJson);
        }
        
        if (year !== undefined) {
            updateFields.push(`year = $${paramIndex++}`);
            queryParams.push(year);
        }
        
        if (brand !== undefined) {
            updateFields.push(`brand = $${paramIndex++}`);
            queryParams.push(brand);
        }
        
        if (playerName !== undefined) {
            updateFields.push(`player_name = $${paramIndex++}`);
            queryParams.push(playerName);
        }
        
        if (cardNumber !== undefined) {
            updateFields.push(`card_number = $${paramIndex++}`);
            queryParams.push(cardNumber);
        }

        // Add the listing ID and seller ID to the params
        queryParams.push(listingId);
        queryParams.push(sellerId);

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const updateQuery = `
            UPDATE listings 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex++} AND seller_id = $${paramIndex++}
            RETURNING *
        `;

        const result = await pool.query(updateQuery, queryParams);

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