const pool = require('../db');
const logError = require('../utils/errorHandler');
const withTransaction = require('../utils/transactionWrapper');
const QueryBuilder = require('../utils/queryBuilder');
const cache = require('../utils/cache');

// Input validation utility
const validateOrderInput = (orderData) => {
    const errors = [];
    if (!orderData.userId) errors.push('User ID is required');
    if (!Array.isArray(orderData.items)) errors.push('Items must be an array');
    if (orderData.items.some(item => !item.id || !item.price || !item.quantity)) {
        errors.push('Each item must have id, price, and quantity');
    }
    return errors;
};

// Function to get an order by ID
const getOrder = async (req, res) => {
    const { id } = req.params;
    const cacheKey = `order:${id}`;

    try {
        // Try to get from cache first
        const cachedOrder = await cache.get(cacheKey);
        if (cachedOrder) {
            return res.json(cachedOrder);
        }

        // If not in cache, get from database
        const result = await pool.query(`
            SELECT 
                o.id, o.buyer_id as user_id, o.listing_id, o.price_at_purchase as total_amount,
                o.subtotal, o.tax_amount, o.tax_rate, o.payment_id, o.status, o.shipping_info,
                o.created_at, o.is_paid, l.title, l.image_url,
                oi.id as item_id, oi.quantity, oi.price
            FROM orders o
            JOIN listings l ON o.listing_id = l.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Format the response
        const order = {
            ...result.rows[0],
            items: result.rows.map(row => ({
                id: row.item_id,
                listing_id: row.listing_id,
                quantity: row.quantity,
                price: row.price,
                title: row.title,
                image_url: row.image_url
            }))
        };

        // Cache the result
        await cache.set(cacheKey, order);

        res.json(order);
    } catch (error) {
        logError(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to create a new order
const createOrder = async (req, res) => {
    const orderData = {
        userId: req.user.id,
        items: req.body.items,
        shippingInfo: req.body.shippingInfo,
        paymentId: req.body.paymentId,
        total: req.body.total,
        tax: req.body.tax,
        subtotal: req.body.subtotal,
        taxRate: req.body.taxRate
    };

    const validationErrors = validateOrderInput(orderData);
    if (validationErrors.length > 0) {
        return res.status(400).json({ 
            message: 'Invalid input', 
            errors: validationErrors 
        });
    }

    try {
        const result = await withTransaction(pool, async (client) => {
            // Batch insert orders
            const orderValues = orderData.items.map((_, index) => 
                `($1, $${index * 8 + 2}, $${index * 8 + 3}, $${index * 8 + 4}, $${index * 8 + 5}, $${index * 8 + 6}, $${index * 8 + 7}, $${index * 8 + 8}, $9)`
            ).join(',');

            const orderParams = orderData.items.flatMap(item => {
                const itemSubtotal = Number(item.price) * item.quantity;
                const itemTax = orderData.tax > 0 ? (itemSubtotal / orderData.subtotal) * orderData.tax : 0;
                const itemTotal = itemSubtotal + itemTax;

                return [
                    item.id,           // listing_id
                    itemTotal,         // price_at_purchase
                    'pending',         // status
                    itemSubtotal,      // subtotal
                    itemTax,          // tax_amount
                    orderData.taxRate, // tax_rate
                    orderData.paymentId, // payment_id
                    orderData.paymentId ? true : false  // is_paid
                ];
            });

            const orderResult = await client.query(
                `INSERT INTO orders (
                    buyer_id, listing_id, price_at_purchase, status, 
                    subtotal, tax_amount, tax_rate, payment_id, shipping_info
                ) VALUES ${orderValues}
                RETURNING id`,
                [orderData.userId, ...orderParams, JSON.stringify(orderData.shippingInfo)]
            );

            const orderIds = orderResult.rows.map(row => row.id);

            // Batch insert order items
            if (orderIds.length > 0) {
                const orderItemsValues = orderData.items.map((_, index) => 
                    `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`
                ).join(',');

                const orderItemsParams = orderData.items.flatMap((item, index) => [
                    orderIds[index],
                    item.id,
                    item.quantity,
                    item.price
                ]);

                await client.query(
                    `INSERT INTO order_items (order_id, listing_id, quantity, price) 
                    VALUES ${orderItemsValues}`,
                    orderItemsParams
                );
            }

            return {
                message: 'Order created successfully',
                orderIds,
                orderId: orderIds[0]
            };
        });

        res.status(201).json(result);
    } catch (error) {
        logError(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to get all orders for a user
const getUserOrders = async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        // Get total count for pagination
        const countQuery = new QueryBuilder()
            .select('SELECT COUNT(*) FROM orders o')
            .addWhere('o.buyer_id = $1', userId)
            .build();

        const countResult = await pool.query(countQuery.text, countQuery.values);
        const totalOrders = parseInt(countResult.rows[0].count);

        // Get paginated orders
        const query = new QueryBuilder()
            .select(`
                SELECT 
                    o.id, o.created_at, o.price_at_purchase as total_amount,
                    o.subtotal, o.tax_amount, o.tax_rate, o.status, o.is_paid,
                    l.id as listing_id, l.title, l.image_url,
                    oi.quantity
                FROM orders o
                JOIN listings l ON o.listing_id = l.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
            `)
            .addWhere('o.buyer_id = $1', userId)
            .addOrderBy('o.created_at', 'DESC')
            .setLimit(limit)
            .setOffset(offset)
            .build();

        const result = await pool.query(query.text, query.values);
        
        const orders = result.rows.map(order => ({
            id: order.id,
            created_at: order.created_at,
            total_amount: order.total_amount,
            subtotal: order.subtotal || order.total_amount,
            tax_amount: order.tax_amount || 0,
            status: order.status,
            is_paid: order.is_paid || false,
            items: [{
                listing_id: order.listing_id,
                quantity: order.quantity,
                price: order.total_amount,
                title: order.title,
                image_url: order.image_url
            }]
        }));

        res.json({
            orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
                totalItems: totalOrders,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        logError(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to update an order by ID
const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logError(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to delete an order by ID
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    logError(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
    getOrder,
    createOrder,
    getUserOrders,
    updateOrder,
    deleteOrder
};
