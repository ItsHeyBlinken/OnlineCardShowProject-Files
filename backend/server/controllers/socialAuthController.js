const jwt = require('jsonwebtoken');
const pool = require('../db');
const bcrypt = require('bcrypt');

// Helper function to find or create a user based on social login data
const findOrCreateUser = async (userData) => {
  try {
    // Check if user already exists
    const { email, name, provider, providerId } = userData;
    
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    let user = userResult.rows[0];
    
    if (user) {
      // User exists, update social login info if needed
      await pool.query(
        `UPDATE users 
         SET last_login = NOW(), 
             ${provider}_id = $1 
         WHERE id = $2`,
        [providerId, user.id]
      );
      
      return user;
    } else {
      // Create new user
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      
      // Generate random password for the account
      // (In this approach, the user can't log in directly unless they set a password)
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      const newUserResult = await pool.query(
        `INSERT INTO users 
         (email, name, username, password_hash, role, ${provider}_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [email, name, username, hashedPassword, 'buyer', providerId]
      );
      
      return newUserResult.rows[0];
    }
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw error;
  }
};

// Google login handler
const googleLogin = async (req, res) => {
  try {
    // For demo mode
    if (req.body.mockLogin && process.env.NODE_ENV === 'development') {
      const { mockCredentials } = req.body;
      
      // Generate a demo token
      const token = jwt.sign(
        { 
          id: 999, 
          email: mockCredentials.email,
          role: 'buyer'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      return res.json({
        message: 'Demo login successful',
        token,
        user: {
          id: 999,
          email: mockCredentials.email,
          name: mockCredentials.name,
          role: 'buyer'
        }
      });
    }
    
    // In a real implementation, you would:
    // 1. Verify the Google ID token sent by the client
    // 2. Extract user information from the verified token
    // 3. Find or create a user in your database
    // 4. Generate a JWT token for your app
    // 5. Return the token and user data
    
    // For production, you would use the Google Auth Library:
    /*
    const { id_token } = req.body;
    const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    // Find or create user
    const user = await findOrCreateUser({
      email: payload.email,
      name: payload.name,
      provider: 'google',
      providerId: payload.sub
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user });
    */
    
    res.status(501).json({ message: 'This endpoint is not fully implemented yet.' });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
};

// Facebook login handler
const facebookLogin = async (req, res) => {
  try {
    // For demo mode
    if (req.body.mockLogin && process.env.NODE_ENV === 'development') {
      const { mockCredentials } = req.body;
      
      // Generate a demo token
      const token = jwt.sign(
        { 
          id: 998, 
          email: mockCredentials.email,
          role: 'buyer'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      return res.json({
        message: 'Demo login successful',
        token,
        user: {
          id: 998,
          email: mockCredentials.email,
          name: mockCredentials.name,
          role: 'buyer'
        }
      });
    }
    
    // Real implementation would verify Facebook access token with Facebook API
    res.status(501).json({ message: 'This endpoint is not fully implemented yet.' });
  } catch (error) {
    console.error('Facebook login error:', error);
    res.status(500).json({ message: 'Server error during Facebook authentication' });
  }
};

// Twitter login handler
const twitterLogin = async (req, res) => {
  try {
    // For demo mode
    if (req.body.mockLogin && process.env.NODE_ENV === 'development') {
      const { mockCredentials } = req.body;
      
      // Generate a demo token
      const token = jwt.sign(
        { 
          id: 997, 
          email: mockCredentials.email,
          role: 'buyer'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      return res.json({
        message: 'Demo login successful',
        token,
        user: {
          id: 997,
          email: mockCredentials.email,
          name: mockCredentials.name,
          role: 'buyer'
        }
      });
    }
    
    // Real implementation would use Twitter API v2 OAuth 2.0
    res.status(501).json({ message: 'This endpoint is not fully implemented yet.' });
  } catch (error) {
    console.error('Twitter login error:', error);
    res.status(500).json({ message: 'Server error during Twitter authentication' });
  }
};

module.exports = {
  googleLogin,
  facebookLogin,
  twitterLogin
}; 