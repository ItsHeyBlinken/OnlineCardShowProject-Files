const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { loginUser, logoutUser, getCurrentUser, becomeSeller } = require('../controllers/authController');
const { googleLogin, facebookLogin, twitterLogin } = require('../controllers/socialAuthController');
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
        if (!req.user) {
            return res.status(401).json({ message: 'No authenticated user' });
        }

        const userResult = await pool.query(
            `SELECT id, name, username, email, role, created_at, image_url, 
                   favorite_sport, favorite_team, favorite_players, 
                   subscription_tier, subscription_id, subscription_status, 
                   stripe_subscription_id, subscription_period_end, pending_subscription_tier
            FROM users WHERE id = $1`,
            [req.user.id]
        );
        
        const user = userResult.rows[0];
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Log the image URL for debugging
        console.log('GET /user endpoint - User image URL:', user.image_url);

        res.json({
            id: user.id,
            email: user.email,
            username: user.username,
            subscriptionTier: user.subscription_tier,
            subscription_id: user.subscription_id,
            subscription_status: user.subscription_status,
            subscription_period_end: user.subscription_period_end,
            name: user.name,
            role: user.role,
            created_at: user.created_at,
            image_url: user.image_url,
            favorite_sport: user.favorite_sport,
            favorite_team: user.favorite_team,
            favorite_players: user.favorite_players,
            pending_subscription_tier: user.pending_subscription_tier
        });
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

// Protected routes that require authentication
router.get('/user', auth, getCurrentUser);
router.post('/logout', auth, logoutUser);
router.post('/become-seller', auth, becomeSeller);

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      name, 
      username, 
      image_url, 
      favorite_sport, 
      favorite_team, 
      favorite_players 
    } = req.body;
    
    console.log('Profile update request received:', { 
      userId, 
      name, 
      username, 
      image_url,
      favorite_sport,
      favorite_team,
      favorite_players
    });
    
    // Check if username is already taken (if username is being changed)
    if (username) {
      const usernameCheck = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );
      
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }
    
    // Get current column names from users table
    const tableInfoQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `;
    const tableInfo = await pool.query(tableInfoQuery);
    const columnNames = tableInfo.rows.map(row => row.column_name);
    
    console.log('Available columns in users table:', columnNames);
    
    // Build the query dynamically
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;
    
    if (name !== undefined && columnNames.includes('name')) {
      updateFields.push(`name = $${paramIndex++}`);
      queryParams.push(name);
    }
    
    if (username !== undefined && columnNames.includes('username')) {
      updateFields.push(`username = $${paramIndex++}`);
      queryParams.push(username);
    }
    
    if (image_url !== undefined && columnNames.includes('image_url')) {
      updateFields.push(`image_url = $${paramIndex++}`);
      queryParams.push(image_url);
      console.log('Adding image_url to update fields:', image_url);
    } else if (image_url !== undefined) {
      console.log('image_url column not found in table or value undefined:', { 
        columnExists: columnNames.includes('image_url'),
        imageUrlValue: image_url
      });
    }
    
    // Add preferences fields if they exist
    if (favorite_sport !== undefined && columnNames.includes('favorite_sport')) {
      updateFields.push(`favorite_sport = $${paramIndex++}`);
      queryParams.push(favorite_sport);
    }
    
    if (favorite_team !== undefined && columnNames.includes('favorite_team')) {
      updateFields.push(`favorite_team = $${paramIndex++}`);
      queryParams.push(favorite_team);
    }
    
    if (favorite_players !== undefined && columnNames.includes('favorite_players')) {
      updateFields.push(`favorite_players = $${paramIndex++}`);
      queryParams.push(favorite_players);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    // Add the user ID to params
    queryParams.push(userId);
    
    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    
    console.log('Executing update query:', {
      query: updateQuery,
      params: queryParams
    });
    
    const result = await pool.query(updateQuery, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User updated successfully:', result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { favorite_sport, favorite_team, favorite_players } = req.body;

    await pool.query(
      'UPDATE users SET favorite_sport = $1, favorite_team = $2, favorite_players = $3 WHERE id = $4',
      [favorite_sport, favorite_team, favorite_players, userId]
    );

    res.status(200).json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Server error while updating preferences' });
  }
});

// Debug route to check if the image_url column exists
router.get('/check-schema', auth, async (req, res) => {
  try {
    // Check if image_url column exists in users table
    const tableInfoQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `;
    const tableInfo = await pool.query(tableInfoQuery);
    
    // Check if the schema includes the image_url column
    const hasImageUrlColumn = tableInfo.rows.some(
      row => row.column_name === 'image_url'
    );
    
    // Get a sample user record
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [req.user.id]);
    
    res.json({
      columns: tableInfo.rows,
      hasImageUrlColumn,
      userSample: userResult.rows[0] || null
    });
  } catch (error) {
    console.error('Error checking schema:', error);
    res.status(500).json({ message: 'Error checking schema', error: error.message });
  }
});

// Debug route to check user image URL
router.get('/check-image', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get the user record with image_url
    const userQuery = 'SELECT id, username, email, image_url FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check if the image_url is accessible (for S3 URLs)
    let imageStatus = 'No image URL';
    if (user.image_url) {
      imageStatus = 'Image URL exists';
      console.log('User image URL exists:', user.image_url);
    }
    
    res.json({
      userId: user.id,
      username: user.username,
      image_url: user.image_url,
      imageStatus
    });
  } catch (error) {
    console.error('Error checking user image:', error);
    res.status(500).json({ message: 'Error checking user image', error: error.message });
  }
});

// Social login routes
router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);
router.post('/twitter-login', twitterLogin);

module.exports = router;