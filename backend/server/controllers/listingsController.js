const pool = require('../db');

// Get all listings
const getAllListings = async (req, res) => {
    try {
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
            WHERE l.active = true
        `;
        
        // Parameters array for prepared statement
        const params = [];
        let paramCounter = 1;
        
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
            WHERE l.active = true
        `;
        
        // Add the same filters to count query
        let countParams = [];
        paramCounter = 1;
        
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
    } catch (err) {
        console.error('Error retrieving listings:', err);
        res.status(500).send("Server error");
    }
};

// Get a single listing by ID
const getListingById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT l.*, u.username as seller_name 
             FROM listings l 
             JOIN users u ON l.seller_id = u.id 
             WHERE l.id = $1`, 
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

// Create a new listing
const createListing = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            price, 
            category, 
            imageUrls, 
            condition,
            year,
            brand,
            playerName,
            cardNumber,
            active = true
        } = req.body;
        
        const seller_id = req.user.id;
        
        // Convert imageUrls array to JSONB
        const imageUrlsJson = JSON.stringify(imageUrls || []);
        
        // Use the first image as the main image_url or set to null if no images
        const primaryImageUrl = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null;
        
        const result = await pool.query(
            `INSERT INTO listings (
                seller_id, 
                title, 
                description, 
                price, 
                category, 
                image_url, 
                image_urls,
                condition,
                year,
                brand,
                player_name,
                card_number,
                active,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP) RETURNING *`,
            [
                seller_id, 
                title, 
                description, 
                price, 
                category, 
                primaryImageUrl, 
                imageUrlsJson,
                condition,
                year,
                brand,
                playerName,
                cardNumber,
                active
            ]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating listing:', err);
        res.status(500).send("Server error");
    }
};

module.exports = {
    getAllListings,
    getListingById,
    createListing
};
