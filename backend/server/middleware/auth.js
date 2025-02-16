const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Add user from payload
        req.user = decoded;
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', {
            error: error.message,
            token: req.header('Authorization') ? 'Token present' : 'No token'
        });
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth; 