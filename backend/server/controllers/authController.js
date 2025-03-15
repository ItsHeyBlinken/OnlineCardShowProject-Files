const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Function to handle user login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query(
      'SELECT id, email, name, created_at, password_hash, username, role FROM users WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0];
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Send back user data (excluding password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      username: user.username,
      role: user.role
    };

    res.json({ user: userData });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to handle user logout
const logoutUser = async (req, res) => {
  try {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to get current user
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No authenticated user' });
    }

    const userResult = await pool.query(
      'SELECT id, name, username, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Make sure all fields are included in the response
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const becomeSeller = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Handle both naming conventions (old and new)
    const { 
      businessName, phoneNumber, address, description,
      // New parameters from BecomeSellerPage
      storeName, contactEmail, shippingPreferences, subscriptionTier, 
      subscriptionActive, verified 
    } = req.body;

    // Use the appropriate parameters
    const finalBusinessName = storeName || businessName;
    const finalDescription = description;
    
    if (!finalBusinessName) {
      return res.status(400).json({ message: 'Business name is required' });
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update user role to seller
      const userResult = await client.query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, created_at',
        ['seller', req.user.id]
      );

      // Create seller profile with a flexible approach to handle both formats
      const insertResult = await client.query(
        `INSERT INTO seller_profiles 
         (user_id, business_name, phone_number, address, description, 
          subscription_tier, subscription_active, shipping_preferences) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.user.id, 
          finalBusinessName, 
          phoneNumber || null, 
          address || null, 
          finalDescription || null,
          subscriptionTier || 'Basic',
          subscriptionActive || false,
          shippingPreferences ? JSON.stringify(shippingPreferences) : null
        ]
      );

      await client.query('COMMIT');

      const updatedUser = userResult.rows[0];
      const sellerProfile = insertResult.rows[0];
      
      // Generate new token with updated role
      const token = jwt.sign(
        { user: { id: updatedUser.id, email: updatedUser.email, role: 'seller' } },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        message: 'Successfully became a seller',
        token, // Send new token
        user: updatedUser,
        sellerProfile
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error becoming seller:', error);
    res.status(500).json({ message: 'Server error during role update', error: error.message });
  }
};

module.exports = {
  loginUser,
  logoutUser,
  getCurrentUser,
  becomeSeller
}; 