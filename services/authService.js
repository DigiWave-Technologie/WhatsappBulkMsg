const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtSecretKey = process.env.JWT_SECRET || "HELLOKRUPALSINH";
const { ApiError } = require('../middleware/errorHandler');
const crypto = require('crypto');

// User login service
const userLogin = async ({ username, password }, deviceInfo) => {
  try {
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Update last login and login history
    user.lastLogin = new Date();
    user.loginHistory.push({
      timestamp: new Date(),
      ipAddress: deviceInfo.ip,
      deviceInfo: {
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os
      }
    });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Add session
    await user.addSession({
      token,
      deviceInfo
    });

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        role: user.role,
        canCreateUsers: user.canCreateUsers,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        permissions: getUserPermissions(user.role),
        apiKey: user.apiKey ? '********' + user.apiKey.slice(-4) : null,
        branding: user.branding,
        whatsappNumbers: user.whatsappNumbers,
        messageLimits: user.messageLimits,
        senderIds: user.senderIds
      }
    };
  } catch (error) {
    throw error;
  }
};

// Helper function to get user permissions based on role
const getUserPermissions = (role) => {
  const permissions = {
    super_admin: {
      canCreateUsers: true,
      canUpdateUsers: true,
      canDeleteUsers: true,
      canViewAllUsers: true,
      canManageAdmins: true,
      canManageResellers: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageSettings: true,
      canManagePricingPlans: true,
      canViewSystemStats: true,
      canManageAllCampaigns: true,
      canManageAllReports: true,
      canManageAllGroups: true,
      canManageAllTemplates: true,
      canManageAllCredits: true,
      canManageAllAPIKeys: true,
      hasUnlimitedCredits: true
    },
    admin: {
      canCreateUsers: true,
      canUpdateUsers: true,
      canDeleteUsers: false,
      canViewAllUsers: false,
      canManageAdmins: false,
      canManageResellers: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageSettings: false,
      canManagePricingPlans: false,
      canViewSystemStats: false,
      canManageAllCampaigns: false,
      canManageAllReports: false,
      canManageAllGroups: false,
      canManageAllTemplates: false,
      canManageAllCredits: false,
      canManageAllAPIKeys: false,
      hasUnlimitedCredits: false
    },
    reseller: {
      canCreateUsers: true,
      canUpdateUsers: true,
      canDeleteUsers: false,
      canViewAllUsers: false,
      canManageAdmins: false,
      canManageResellers: false,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageSettings: false,
      canManagePricingPlans: false,
      canViewSystemStats: false,
      canManageAllCampaigns: false,
      canManageAllReports: false,
      canManageAllGroups: false,
      canManageAllTemplates: false,
      canManageAllCredits: false,
      canManageAllAPIKeys: false,
      hasUnlimitedCredits: false
    },
    user: {
      canCreateUsers: false,
      canUpdateUsers: false,
      canDeleteUsers: false,
      canViewAllUsers: false,
      canManageAdmins: false,
      canManageResellers: false,
      canManageUsers: false,
      canViewAnalytics: false,
      canManageSettings: false,
      canManagePricingPlans: false,
      canViewSystemStats: false,
      canManageAllCampaigns: false,
      canManageAllReports: false,
      canManageAllGroups: false,
      canManageAllTemplates: false,
      canManageAllCredits: false,
      canManageAllAPIKeys: false,
      hasUnlimitedCredits: false
    }
  };

  return permissions[role] || permissions.user;
};

// Password modification service
const modifyPassword = async (modifyData) => {
  try {
    const { email, password_hash, newpassword } = modifyData;
    
    if (!email || !password_hash || !newpassword) {
      throw new Error("All fields are required");
    }

    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    const passwordMatch = await user.comparePassword(password_hash);
    if (!passwordMatch) throw new Error("Current password is incorrect");

    user.password = newpassword;
    await user.save();

    return { message: "Password updated successfully" };
  } catch (error) {
    throw error;
  }
};

// Create user service (only for super_admin and authorized admin)
const createUser = async (userData, creatorId) => {
  try {
    // Check if username already exists
    const existingUser = await User.findOne({ username: userData.username });
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Check if email already exists (if provided)
    if (userData.email) {
      const existingEmail = await User.findOne({ email: userData.email });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Get creator's role
    const creator = await User.findById(creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    // Validate role hierarchy
    if (creator.role === 'admin' && userData.role === 'super_admin') {
      throw new Error('Admin cannot create super admin users');
    }

    if (creator.role === 'reseller' && (userData.role === 'admin' || userData.role === 'super_admin')) {
      throw new Error('Reseller cannot create admin or super admin users');
    }

    // Set canCreateUsers based on role
    const canCreateUsers = userData.role === 'super_admin' || userData.role === 'admin';

    // Create new user with optional fields
    const user = new User({
      username: userData.username,
      password: userData.password,
      email: userData.email || undefined,
      firstName: userData.firstName || undefined,
      lastName: userData.lastName || undefined,
      mobileNumber: userData.mobileNumber || undefined,
      role: userData.role || 'user',
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      canCreateUsers,
      createdBy: creatorId
    });

    // Save user
    await user.save();

    // Return user data without sensitive information
    return {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };
  } catch (error) {
    throw error;
  }
};

// Update user service
const updateUser = async ({ id, ...updateData }, updaterId) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updater = await User.findById(updaterId);
    if (!updater) {
      throw new Error('Updater not found');
    }

    // Validate role hierarchy for updates
    if (updater.role === 'admin' && user.role === 'super_admin') {
      throw new Error('Admin cannot update super admin users');
    }

    if (updater.role === 'reseller' && (user.role === 'admin' || user.role === 'super_admin')) {
      throw new Error('Reseller cannot update admin or super admin users');
    }

    // Check if username is being updated and is unique
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await User.findOne({ username: updateData.username });
      if (existingUser) {
        throw new Error('Username already exists');
      }
    }

    // Check if email is being updated and is unique
    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await User.findOne({ email: updateData.email });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Update canCreateUsers based on role if role is being updated
    if (updateData.role) {
      updateData.canCreateUsers = updateData.role === 'super_admin' || updateData.role === 'admin';
    }

    Object.assign(user, updateData);
    await user.save();
    return user;
  } catch (error) {
    throw error;
  }
};

// Upload user logo service
const uploadUserLogo = async (data, userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    user.logo = data.logo;
    await user.save();
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Delete user service
const deleteUser = async (userId) => {
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Change password service (can be done by user themselves)
const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  return { message: 'Password updated successfully' };
};

// Get all users (with role-based access)
const getAllUsers = async (requesterId) => {
  const requester = await User.findById(requesterId);
  if (!requester) {
    throw new ApiError(404, 'Requester not found');
  }

  let query = {};
  
  // Super admin can see all users
  if (requester.role === 'super_admin') {
    query = {};
  }
  // Admin can see users they created and users below their role
  else if (requester.role === 'admin') {
    query = {
      $or: [
        { createdBy: requesterId },
        { role: { $in: ['reseller', 'user'] } }
      ]
    };
  }
  // Reseller can only see users they created
  else if (requester.role === 'reseller') {
    query = { createdBy: requesterId };
  }
  // Regular users can't see other users
  else {
    throw new ApiError(403, 'Not authorized to view users');
  }

  const users = await User.find(query)
    .select('-password -sessions')
    .populate('createdBy', 'firstName lastName email');
  
  return users;
};

// Logout service
const logout = async (userId, token) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await user.removeSession(token);
  return { message: 'Logged out successfully' };
};

// Generate API key for a user
const generateApiKey = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate a random API key
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    // Update user with new API key
    user.apiKey = apiKey;
    user.apiKeyCreatedAt = new Date();
    await user.save();

    return {
      apiKey,
      message: 'API key generated successfully'
    };
  } catch (error) {
    throw error;
  }
};

// Revoke API key for a user
const revokeApiKey = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove API key
    user.apiKey = null;
    user.apiKeyCreatedAt = null;
    user.apiKeyLastUsed = null;
    await user.save();

    return {
      message: 'API key revoked successfully'
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  userLogin,
  modifyPassword,
  createUser,
  updateUser,
  uploadUserLogo,
  deleteUser,
  getAllUsers,
  changePassword,
  logout,
  getUserPermissions,
  generateApiKey,
  revokeApiKey
};
