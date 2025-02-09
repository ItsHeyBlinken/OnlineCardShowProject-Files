const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { loginUser, logoutUser, getCurrentUser, becomeSeller } = require('../controllers/authController');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Public routes
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt for:', email); // Debug log

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Please provide both email and password' 
            });
        }

        // Get user from database
        const result = await pool.query(
            'SELECT id, email, password_hash, name, username, role, created_at FROM users WHERE email = $1',
            [email]
        );

        console.log('Database query result:', result.rows[0] ? 'User found' : 'User not found'); // Debug log

        const user = result.rows[0];
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        console.log('Password verification:', isMatch ? 'Success' : 'Failed'); // Debug log

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT payload
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        };

        // Generate token
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Token generated successfully'); // Debug log

        // Send response with user data and token
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error('Server error during login:', error);
        res.status(500).json({ 
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.post('/logout', logoutUser);

// Protected routes
router.get('/user', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Fetching user:', userId);

        const result = await pool.query(
            'SELECT id, username, email, role FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('User found:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/become-seller
// @desc    Update user role to seller
// @access  Private
router.post('/become-seller', auth, async (req, res) => {
    try {
        const userId = req.user.id; // Get userId from auth middleware
        const { businessName, description } = req.body;

        console.log('Attempting to update user to seller:', {
            userId,
            businessName,
            description
        });

        // Update user role to seller
        const updateResult = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
            ['seller', userId]
        );

        // Create seller profile
        const sellerResult = await pool.query(
            'INSERT INTO seller_profiles (user_id, business_name, description) VALUES ($1, $2, $3) RETURNING *',
            [userId, businessName, description]
        );

        res.json({
            message: 'Successfully became a seller',
            user: updateResult.rows[0],
            profile: sellerResult.rows[0]
        });

    } catch (error) {
        console.error('Error in become-seller:', error);
        res.status(500).json({ message: 'Failed to become seller', error: error.message });
    }
});

module.exports = router;