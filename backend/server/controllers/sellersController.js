const pool = require('../db');

const getFeaturedSellers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                u.id,
                u.username,
                u.email,
                sp.rating,
                sp.image_url,
                COUNT(l.id) as listing_count,
                COALESCE(AVG(l.price), 0) as avg_price
            FROM users u
            LEFT JOIN seller_profiles sp ON u.id = sp.user_id
            INNER JOIN listings l ON u.id = l.seller_id
            WHERE u.role = 'seller'
                AND l.active = true
            GROUP BY u.id, u.username, u.email, sp.rating, sp.image_url
            HAVING COUNT(l.id) > 0
            ORDER BY RANDOM()
            LIMIT 6`
        );

        console.log('Featured sellers result:', {
            count: result.rows.length,
            data: result.rows
        });

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching featured sellers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getTopSellers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                l.id,
                l.title,
                l.price,
                l.image_url,
                u.username as seller_name,
                u.id as seller_id
            FROM listings l
            JOIN users u ON l.seller_id = u.id
            WHERE l.active = true
            ORDER BY RANDOM()
            LIMIT 4`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching top sellers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDeals = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                l.id,
                l.title,
                l.price,
                l.image_url,
                u.username as seller_name,
                u.id as seller_id
            FROM listings l
            JOIN users u ON l.seller_id = u.id
            WHERE l.active = true
            ORDER BY RANDOM()
            LIMIT 6`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching deals:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getRecentListings = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                l.id,
                l.title,
                l.price,
                l.image_url,
                l.image_urls,
                u.username as seller_name,
                u.id as seller_id
            FROM listings l
            JOIN users u ON l.seller_id = u.id
            WHERE l.active = true
            ORDER BY l.created_at DESC
            LIMIT 8`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching recent listings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getFeaturedSellers,
    getTopSellers,
    getDeals,
    getRecentListings
};