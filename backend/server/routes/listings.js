const express = require('express');
const router = express.Router();
const { getAllListings, getListingById, createListing } = require('../controllers/listingsController');
const pool = require('../db');
const auth = require('../middleware/auth');

// Route to get all listings
router.get('/', getAllListings);

// Route to get a single listing
router.get('/:id', getListingById);

// Route to create a new listing
router.post('/', createListing);

// Create a new listing
router.post('/create', auth, async (req, res) => {
    try {
        const { 
            title, 
            description, 
            price, 
            condition, 
            category, 
            imageUrls,
            year,
            brand,
            playerName,
            cardNumber,
            tempListingId 
        } = req.body;
        
        // Convert imageUrls array to JSONB
        const imageUrlsJson = JSON.stringify(imageUrls || []);
        
        // Use the first image as the main image_url or set to null if no images
        const primaryImageUrl = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null;
        
        const result = await pool.query(
            `INSERT INTO listings 
             (title, description, price, condition, category, image_url, image_urls, seller_id, year, brand, player_name, card_number, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP) 
             RETURNING *`,
            [title, description, price, condition, category, primaryImageUrl, imageUrlsJson, req.user.id, year, brand, playerName, cardNumber]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all listings for a seller
router.get('/seller/:sellerId', auth, async (req, res) => {
    try {
        const sellerId = req.params.sellerId;
        const result = await pool.query(
            'SELECT * FROM listings WHERE seller_id = $1 ORDER BY created_at DESC',
            [sellerId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all listings for the store
router.get('/store/:storeId', async (req, res) => {
    try {
        const storeId = req.params.storeId;
        const { 
            category, 
            condition, 
            minPrice, 
            maxPrice, 
            sortBy, 
            search,
            limit = 50,
            offset = 0
        } = req.query;

        // Start building the query
        let query = `
            SELECT l.*, u.username as seller_name 
            FROM listings l 
            JOIN users u ON l.seller_id = u.id 
            WHERE l.seller_id = $1 AND l.active = true
        `;
        
        // Parameters array for prepared statement
        const params = [storeId];
        let paramCounter = 2;
        
        // Add category filter
        if (category) {
            query += ` AND l.category = $${paramCounter}`;
            params.push(category);
            paramCounter++;
        }
        
        // Add condition filter
        if (condition) {
            query += ` AND l.condition = $${paramCounter}`;
            params.push(condition);
            paramCounter++;
        }
        
        // Add price range filter
        if (minPrice) {
            query += ` AND l.price >= $${paramCounter}`;
            params.push(parseFloat(minPrice));
            paramCounter++;
        }
        
        if (maxPrice) {
            query += ` AND l.price <= $${paramCounter}`;
            params.push(parseFloat(maxPrice));
            paramCounter++;
        }
        
        // Add search filter
        if (search) {
            query += ` AND (
                l.title ILIKE $${paramCounter} OR 
                l.description ILIKE $${paramCounter} OR
                l.player_name ILIKE $${paramCounter} OR
                l.brand ILIKE $${paramCounter}
            )`;
            params.push(`%${search}%`);
            paramCounter++;
        }
        
        // Add sorting
        if (sortBy) {
            switch (sortBy) {
                case 'priceAsc':
                    query += ` ORDER BY l.price ASC`;
                    break;
                case 'priceDesc':
                    query += ` ORDER BY l.price DESC`;
                    break;
                case 'newest':
                    query += ` ORDER BY l.created_at DESC`;
                    break;
                case 'oldest':
                    query += ` ORDER BY l.created_at ASC`;
                    break;
                default:
                    query += ` ORDER BY l.created_at DESC`;
            }
        } else {
            // Default sort by newest
            query += ` ORDER BY l.created_at DESC`;
        }
        
        // Add pagination
        query += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
        params.push(parseInt(limit));
        params.push(parseInt(offset));
        
        // Execute the query
        const result = await pool.query(query, params);
        
        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) FROM listings l 
            WHERE l.seller_id = $1 AND l.active = true
        `;
        
        // Add the same filters to count query
        let countParams = [storeId];
        paramCounter = 2;
        
        if (category) {
            countQuery += ` AND l.category = $${paramCounter}`;
            countParams.push(category);
            paramCounter++;
        }
        
        if (condition) {
            countQuery += ` AND l.condition = $${paramCounter}`;
            countParams.push(condition);
            paramCounter++;
        }
        
        if (minPrice) {
            countQuery += ` AND l.price >= $${paramCounter}`;
            countParams.push(parseFloat(minPrice));
            paramCounter++;
        }
        
        if (maxPrice) {
            countQuery += ` AND l.price <= $${paramCounter}`;
            countParams.push(parseFloat(maxPrice));
            paramCounter++;
        }
        
        if (search) {
            countQuery += ` AND (
                l.title ILIKE $${paramCounter} OR 
                l.description ILIKE $${paramCounter} OR
                l.player_name ILIKE $${paramCounter} OR
                l.brand ILIKE $${paramCounter}
            )`;
            countParams.push(`%${search}%`);
            paramCounter++;
        }
        
        const countResult = await pool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);
        
        res.json({
            listings: result.rows,
            totalCount,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (error) {
        console.error('Error fetching store listings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get featured sellers
router.get('/featured-sellers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT u.id, u.username, 
                   COALESCE(COUNT(l.id), 0) as listing_count,
                   COALESCE(MIN(l.price), 0) as min_price
            FROM users u
            LEFT JOIN seller_profiles sp ON u.id = sp.user_id
            LEFT JOIN listings l ON u.id = l.seller_id
            WHERE u.role = 'seller'
            GROUP BY u.id, u.username
            ORDER BY listing_count DESC
            LIMIT 6
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching featured sellers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get deals
router.get('/deals', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT l.*, u.username as seller_name
            FROM listings l
            LEFT JOIN users u ON l.seller_id = u.id
            WHERE l.price <= 50.00
            ORDER BY l.created_at DESC
            LIMIT 6
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching deals:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
