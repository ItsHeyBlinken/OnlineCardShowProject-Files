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
        const { seller_id, title, description, price, category, image_url } = req.body;
        const result = await pool.query(
            "INSERT INTO listings (seller_id, title, description, price, category, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [seller_id, title, description, price, category, image_url]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

module.exports = { getAllListings, getListingById, createListing };
