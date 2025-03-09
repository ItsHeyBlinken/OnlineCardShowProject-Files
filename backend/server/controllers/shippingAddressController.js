const pool = require('../db');

/**
 * Get a user's shipping address
 */
const getUserShippingAddress = async (req, res) => {
  const { userId } = req.params;
  
  // Ensure the user can only access their own shipping address
  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  
  try {
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
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all shipping addresses for a user
 */
const getAllUserShippingAddresses = async (req, res) => {
  const { userId } = req.params;
  
  // Ensure the user can only access their own shipping addresses
  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
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
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create or update a user's shipping address
 */
const saveUserShippingAddress = async (req, res) => {
  const { userId } = req.params;
  const { 
    name, address_line1, address_line2, city, state, 
    postal_code, country, phone, is_default 
  } = req.body;
  
  // Ensure the user can only update their own shipping address
  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  
  // Validate required fields
  if (!name || !address_line1 || !city || !state || !postal_code || !country || !phone) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
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
          postal_code, country, phone, is_default || true,
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
          postal_code, country, phone, is_default || true
        ]
      );
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving user shipping address:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a user's shipping address
 */
const deleteUserShippingAddress = async (req, res) => {
  const { userId, addressId } = req.params;
  
  // Ensure the user can only delete their own shipping address
  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
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
    console.error('Error deleting user shipping address:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserShippingAddress,
  getAllUserShippingAddresses,
  saveUserShippingAddress,
  deleteUserShippingAddress
}; 