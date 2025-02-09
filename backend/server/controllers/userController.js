const bcrypt = require('bcrypt');
const pool = require('../db');
const jwt = require('jsonwebtoken');

const VALID_ROLES = ['buyer', 'seller'];

// Function to handle user sign-up
const signUpUser = async (req, res) => {
  const { name, username, email, password, role = 'buyer' } = req.body;

  try {
    // Validate role if provided
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be either buyer or seller' });
    }

    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const result = await pool.query(
      'INSERT INTO users (name, username, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id, name, username, email, role, created_at',
      [name, username, email, hashedPassword, role]
    );

    const newUser = result.rows[0];
    const token = jwt.sign(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role
        }
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
      token: token
    });

  } catch (error) {
    console.error('Error signing up user:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

const updateUserPreferences = async (req, res) => {
    const { favorite_sport, favorite_team, favorite_players } = req.body;
    const userId = req.params.id;

    try {
        await pool.query(
            'UPDATE users SET favorite_sport = $1, favorite_team = $2, favorite_players = $3 WHERE id = $4',
            [favorite_sport, favorite_team, favorite_players, userId]
        );

        res.status(200).json({ message: 'Preferences updated successfully' });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ message: 'Server error while updating preferences' });
    }
};

module.exports = {
  signUpUser,
  updateUserPreferences
};
