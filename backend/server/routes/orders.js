const express = require('express');
const router = express.Router();
const { getOrder, createOrder, updateOrder, deleteOrder } = require('../controllers/orderController');

// Route to get an order by ID
router.get('/:id', getOrder);

// Route to create a new order
router.post('/', createOrder);

// Route to update an order by ID
router.put('/:id', updateOrder);

// Route to delete an order by ID
router.delete('/:id', deleteOrder);

module.exports = router;
