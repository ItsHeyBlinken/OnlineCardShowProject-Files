const jwt = require('jsonwebtoken');
const db = require('../db');

// Authenticate JWT token and attach user to request object
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }
    
    // Set user in request object
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

// Check if user is an admin
const isAdmin = (req, res, next) => {
  // If no user is set in request, user isn't authenticated yet
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  
  // Check if user role is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  isAdmin
}; 