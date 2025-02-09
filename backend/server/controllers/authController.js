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
      'SELECT id, name, username, email, created_at FROM users WHERE id = $1',
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

    const { businessName, phoneNumber, address, description } = req.body;

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update user role to seller
      const userResult = await client.query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, created_at',
        ['seller', req.user.id]
      );

      // Create seller profile
      await client.query(
        'INSERT INTO seller_profiles (user_id, business_name, phone_number, address, description) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, businessName, phoneNumber, address, description]
      );

      await client.query('COMMIT');

      const updatedUser = userResult.rows[0];
      res.json({
        message: 'Successfully upgraded to seller account',
        user: updatedUser
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error becoming seller:', error);
    res.status(500).json({ message: 'Server error while upgrading to seller' });
  }
};

module.exports = {
  loginUser,
  logoutUser,
  getCurrentUser,
  becomeSeller
}; 