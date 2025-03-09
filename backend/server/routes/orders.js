const express = require('express');
const router = express.Router();
const { getOrder, createOrder, updateOrder, deleteOrder, getUserOrders } = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Route to get all orders for the authenticated user
router.get('/my-orders', authenticateToken, getUserOrders);

// Route to get an order by ID (requires authentication)
router.get('/:id', authenticateToken, getOrder);

// Route to create a new order
router.post('/', authenticateToken, createOrder);

// Route to update an order by ID
router.put('/:id', authenticateToken, updateOrder);

// Route to delete an order by ID
router.delete('/:id', authenticateToken, deleteOrder);

module.exports = router;
