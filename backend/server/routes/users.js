const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db');

// Get a user's shipping address
router.get('/:userId/shipping-address', auth, async (req, res) => {
  const { userId } = req.params;
  
  // Ensure the user can only access their own shipping address
  if (req.user && req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  
  try {
    // Check if the user_shipping_addresses table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_shipping_addresses'
      )
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log('user_shipping_addresses table does not exist');
      return res.status(404).json({ message: 'Shipping address service not available' });
    }
    
    const result = await pool.query(
      `SELECT id, name, address_line1, address_line2, city, state, postal_code, 
              country, phone, is_default, created_at, updated_at
       FROM user_shipping_addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC
       LIMIT 1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No shipping address found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user shipping address:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all shipping addresses for a user
router.get('/:userId/shipping-addresses', auth, async (req, res) => {
  const { userId } = req.params;
  
  // Ensure the user can only access their own shipping addresses
  if (req.user && req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  
  try {
    const result = await pool.query(
      `SELECT id, name, address_line1, address_line2, city, state, postal_code, 
              country, phone, is_default, created_at, updated_at
       FROM user_shipping_addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user shipping addresses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update a user's shipping address
router.post('/:userId/shipping-address', auth, async (req, res) => {
  const { userId } = req.params;
  const { 
    name, address_line1, address_line2, city, state, 
    postal_code, country, phone, is_default 
  } = req.body;
  
  // Ensure the user can only update their own shipping address
  if (req.user && req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  
  // Validate required fields
  if (!name || !address_line1 || !city || !state || !postal_code || !country) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    // Check if the user_shipping_addresses table exists, create it if not
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_shipping_addresses'
      )
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log('Creating user_shipping_addresses table');
      await pool.query(`
        CREATE TABLE user_shipping_addresses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          address_line1 VARCHAR(255) NOT NULL,
          address_line2 VARCHAR(255),
          city VARCHAR(255) NOT NULL,
          state VARCHAR(50) NOT NULL,
          postal_code VARCHAR(20) NOT NULL,
          country VARCHAR(50) NOT NULL,
          phone VARCHAR(50),
          is_default BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Check if the user already has a shipping address
    const existingResult = await pool.query(
      `SELECT id FROM user_shipping_addresses 
       WHERE user_id = $1 
       ORDER BY is_default DESC, created_at DESC 
       LIMIT 1`,
      [userId]
    );
    
    let result;
    
    if (existingResult.rows.length > 0) {
      // Update existing address
      const addressId = existingResult.rows[0].id;
      result = await pool.query(
        `UPDATE user_shipping_addresses
         SET name = $1, address_line1 = $2, address_line2 = $3, city = $4, 
             state = $5, postal_code = $6, country = $7, phone = $8, 
             is_default = $9, updated_at = CURRENT_TIMESTAMP
         WHERE id = $10 AND user_id = $11
         RETURNING *`,
        [
          name, address_line1, address_line2 || '', city, state, 
          postal_code, country, phone || '', is_default || true,
          addressId, userId
        ]
      );
    } else {
      // Create new address
      result = await pool.query(
        `INSERT INTO user_shipping_addresses
           (user_id, name, address_line1, address_line2, city, state, 
            postal_code, country, phone, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userId, name, address_line1, address_line2 || '', city, state, 
          postal_code, country, phone || '', is_default || true
        ]
      );
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving user shipping address:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a shipping address
router.delete('/:userId/shipping-address/:addressId', auth, async (req, res) => {
  const { userId, addressId } = req.params;
  
  // Ensure the user can only delete their own shipping address
  if (req.user && req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  
  try {
    const result = await pool.query(
      'DELETE FROM user_shipping_addresses WHERE id = $1 AND user_id = $2 RETURNING id',
      [addressId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Shipping address not found' });
    }
    
    res.json({ message: 'Shipping address deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipping address:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a health check route
router.get('/health-check', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'User routes are available' });
});

module.exports = router;
