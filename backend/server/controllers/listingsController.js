const pool = require('../db');

// Get all listings
const getAllListings = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM listings");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

// Get a single listing by ID
const getListingById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM listings WHERE id = $1", [id]);
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
