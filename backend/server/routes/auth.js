const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { loginUser, logoutUser, getCurrentUser, becomeSeller } = require('../controllers/authController');
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Public routes
router.post('/login', async (req, res) => {
    try {
        console.log('Login request received:', {
            body: req.body,
            hasEmail: !!req.body.email,
            hasPassword: !!req.body.password
        });

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email and password are required'
            });
        }

        // Get user from database
        const result = await pool.query(
            'SELECT id, email, username, name, role, password_hash FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.password_hash) {
            console.error('User found but password_hash is null:', {
                userId: user.id,
                email: user.email
            });
            return res.status(500).json({ message: 'Account configuration error' });
        }

        // Compare password with password_hash
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Remove sensitive data
        delete user.password_hash;

        console.log('Login successful:', {
            userId: user.id,
            email: user.email,
            role: user.role
        });

        res.json({
            token,
            user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error',
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.post('/logout', logoutUser);

// Protected routes
router.get('/user', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT id, name, username, email, role, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get user error:', error);
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

// Add this test endpoint to the auth router
router.get('/test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            message: 'Database connection successful',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ message: 'Database connection failed' });
    }
});

// Add this temporary endpoint to reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update the user's password
        const result = await pool.query(
            'UPDATE users SET password = $1 WHERE email = $2 RETURNING *',
            [hashedPassword, email]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add registration route - this should NOT require authentication
router.post('/register', async (req, res) => {
    try {
        const { email, password, username, name, role } = req.body;

        console.log('Registration attempt:', { email, username, role }); // Debug log

        // Check if user already exists
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user with password_hash
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, username, name, role) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, email, username, name, role`,
            [email, hashedPassword, username, name, role || 'buyer']
        );

        const newUser = result.rows[0];

        const token = jwt.sign(
            { 
                id: newUser.id, 
                email: newUser.email,
                role: newUser.role
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Registration successful:', { email: newUser.email, role: newUser.role }); // Debug log

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: newUser
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Server error',
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Verify token and get user data
router.get('/me', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, username, role FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;