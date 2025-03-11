const pool = require('../db');

// Function to get an order by ID
const getOrder = async (req, res) => {
  const { id } = req.params;
  try {
    // Get the order details from existing schema
    const orderResult = await pool.query(
      `SELECT o.id, o.buyer_id as user_id, o.listing_id, o.price_at_purchase as total_amount, 
              o.subtotal, o.tax_amount, o.tax_rate, o.payment_id, o.status, o.shipping_info,
              o.created_at, o.is_paid, l.title, l.image_url
       FROM orders o
       JOIN listings l ON o.listing_id = l.id
       WHERE o.id = $1`,
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Get the order items
    const itemsResult = await pool.query(
      `SELECT oi.id, oi.listing_id, oi.quantity, oi.price
       FROM order_items oi
       WHERE oi.order_id = $1`,
      [id]
    );
    
    // If there are no items in order_items, create a synthetic one from the order itself
    const items = itemsResult.rows.length > 0 ? itemsResult.rows : [{
      id: null,
      listing_id: orderResult.rows[0].listing_id,
      quantity: 1,
      price: orderResult.rows[0].price_at_purchase,
      title: orderResult.rows[0].title,
      image_url: orderResult.rows[0].image_url
    }];
    
    // Combine the results
    const order = {
      ...orderResult.rows[0],
      items
    };
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to create a new order
const createOrder = async (req, res) => {
  const { userId, items, shippingInfo, paymentId, total, tax, subtotal, taxRate } = req.body;
  
  if (!items || !items.length) {
    return res.status(400).json({ message: 'No items provided' });
  }
  
  // Start a transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // For existing schema, we create one order per item (as the schema has listing_id in the orders table)
    const orderIds = [];
    
    for (const item of items) {
      // Calculate individual item totals
      const itemSubtotal = Number(item.price) * item.quantity;
      const itemTax = tax > 0 ? (itemSubtotal / subtotal) * tax : 0;
      const itemTotal = itemSubtotal + itemTax;
      
      // 1. Create the order
      const orderResult = await client.query(
        `INSERT INTO orders (
          buyer_id, 
          listing_id, 
          price_at_purchase, 
          status, 
          subtotal, 
          tax_amount, 
          tax_rate,
          payment_id,
          shipping_info,
          is_paid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING id`,
        [
          userId, 
          item.id, 
          itemTotal, 
          'pending',
          itemSubtotal,
          itemTax,
          taxRate,
          paymentId,
          JSON.stringify(shippingInfo),
          paymentId ? true : false
        ]
      );
      
      const orderId = orderResult.rows[0].id;
      orderIds.push(orderId);
      
      // 2. Insert into order_items
      await client.query(
        `INSERT INTO order_items (order_id, listing_id, quantity, price) 
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.quantity, item.price]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Order created successfully',
      orderIds: orderIds,
      // Return the first ID for backwards compatibility
      orderId: orderIds[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// Function to get all orders for a user
const getUserOrders = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available from auth middleware
  
  try {
    const result = await pool.query(
      `SELECT o.id, o.created_at, o.price_at_purchase as total_amount, 
              o.subtotal, o.tax_amount, o.tax_rate, o.status, o.is_paid,
              l.id as listing_id, l.title, l.image_url,
              COALESCE(oi.quantity, 1) as quantity
       FROM orders o
       JOIN listings l ON o.listing_id = l.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.buyer_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    
    // Format the orders for the frontend
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
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
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
    console.error('Error updating order:', error);
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
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getUserOrders
};
