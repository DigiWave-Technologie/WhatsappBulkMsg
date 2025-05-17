const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('./errorHandler');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Check if account is locked
    if (user.accountLockout && user.accountLockout.isLocked) {
      throw new ApiError(403, 'Account is locked. Please contact administrator to unlock your account');
    }

    // Check if session exists and is active
    const session = user.sessions.find(s => s.token === token);
    if (!session || !session.isActive) {
      throw new ApiError(401, 'Session expired or invalid');
    }

    // Update session last active time
    session.lastActive = new Date();
    await user.save();

    // Set user info in request
    req.user = {
      userId: user._id,
      username: user.username,
      role: user.role
    };
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware
};
