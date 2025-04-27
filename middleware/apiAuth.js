const User = require('../models/User');

/**
 * Middleware to authenticate API requests using API key
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    // Get API key from request header
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }

    // Find user by API key
    const user = await User.findOne({ apiKey });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Update last used timestamp
    user.apiKeyLastUsed = new Date();
    await user.save();

    // Add user info to request
    req.user = {
      userId: user._id,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during API authentication'
    });
  }
};

module.exports = {
  authenticateApiKey
}; 