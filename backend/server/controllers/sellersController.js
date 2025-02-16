const pool = require('../db');

const getFeaturedSellers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id,
                u.username as name,
                COUNT(l.id) as listing_count,
                MIN(l.price) as min_price,
                COALESCE(sp.rating, 0) as rating,
                COUNT(DISTINCT o.id) as sales,
                COALESCE(sp.image_url, 'https://via.placeholder.com/150') as image
            FROM users u
            LEFT JOIN seller_profiles sp ON u.id = sp.user_id
            LEFT JOIN listings l ON u.id = l.seller_id
            LEFT JOIN orders o ON l.id = o.listing_id
            WHERE u.role = 'seller'
            GROUP BY u.id, u.username, sp.rating, sp.image_url
            ORDER BY sales DESC
            LIMIT 3
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching featured sellers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTopSellers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                l.id,
                l.title,
                l.price,
                l.image_url as image,
                u.username as seller
            FROM listings l
            JOIN users u ON l.seller_id = u.id
            WHERE l.created_at >= NOW() - INTERVAL '7 days'
            ORDER BY l.price DESC
            LIMIT 4
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching top sellers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getFeaturedSellers,
    getTopSellers
}; 