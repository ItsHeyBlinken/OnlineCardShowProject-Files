const pool = require('../db');

// Get seller dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const sellerId = req.user.id;

        const listingsResult = await pool.query(
            'SELECT COUNT(*) FROM listings WHERE seller_id = $1',
            [sellerId]
        );

        const salesResult = await pool.query(`
            SELECT 
                SUM(o.price_at_purchase) as total_sales,
                SUM(CASE 
                    WHEN o.created_at >= NOW() - INTERVAL '30 days' 
                    THEN o.price_at_purchase 
                    ELSE 0 
                END) as monthly_revenue
            FROM orders o
            JOIN listings l ON o.listing_id = l.id
            WHERE l.seller_id = $1`,
            [sellerId]
        );

        const pendingOrdersResult = await pool.query(`SELECT COUNT(*) as pending_orders FROM orders o JOIN listings l ON o.listing_id = l.id WHERE l.seller_id = $1 AND o.status = 'pending'`,
            [sellerId]
        );

        res.json({
            activeListings: parseInt(listingsResult.rows[0].count),
            totalSales: parseFloat(salesResult.rows[0].total_sales || 0),
            monthlyRevenue: parseFloat(salesResult.rows[0].monthly_revenue || 0),
            pendingOrders: parseInt(pendingOrdersResult.rows[0].pending_orders)
        });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get seller's listings
const getSellerListings = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const result = await pool.query(
            'SELECT * FROM listings WHERE seller_id = $1 ORDER BY created_at DESC',
            [sellerId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching seller listings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get seller's orders
const getSellerOrders = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const result = await pool.query(`
            SELECT 
                o.id,
                o.buyer_id,
                o.listing_id,
                o.price_at_purchase,
                o.status,
                o.created_at,
                l.title as listing_title,
                u.username as buyer_username
            FROM orders o
            JOIN listings l ON o.listing_id = l.id
            JOIN users u ON o.buyer_id = u.id
            WHERE l.seller_id = $1
            ORDER BY o.created_at DESC`,
            [sellerId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getDashboardStats,
    getSellerListings,
    getSellerOrders
}; 