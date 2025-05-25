const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

const checkRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Get token from header
            const token = req.header('Authorization')?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }

            // Verify token
            const decoded = jwt.verify(token, config.jwtSecret);
            
            // Get user from database
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if user's role is allowed
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            }

            // Add user to request object
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    };
};

// Specific role middleware functions
const isSuperAdmin = checkRole(['super_admin']);
const isAdmin = checkRole(['admin', 'super_admin']);
const isReseller = checkRole(['reseller', 'admin', 'super_admin']);
const isUser = checkRole(['user', 'reseller', 'admin', 'super_admin']);

module.exports = {
    checkRole,
    isSuperAdmin,
    isAdmin,
    isReseller,
    isUser
}; 