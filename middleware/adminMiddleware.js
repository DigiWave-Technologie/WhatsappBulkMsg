// middleware/adminMiddleware.js
const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
  try {
    // Get user from request (set by auth middleware)
    const userId = req.user.userId;
    
    // Find user and check if they are an admin
    const user = await User.findById(userId);
    
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking admin privileges'
    });
  }
};

module.exports = { adminMiddleware }; 