const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtSecretKey = process.env.JWT_SECRET || "HELLOKRUPALSINH";
const { ApiError } = require('../middleware/errorHandler');
const crypto = require('crypto');
const { validatePasswordStrength } = require('../middleware/validateRequest');
const path = require('path');
const fs = require('fs');

// User login service
const userLogin = async ({ username, password }, deviceInfo) => {
  try {
    // Find user by username
    const user = await User.findOne({ username }).populate('createdBy', 'username');
    
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Check if account is locked
    if (user.accountLockout && user.accountLockout.isLocked) {
      throw new Error('Account is locked. Please contact administrator to unlock your account');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Log failed login attempt
      user.securityLog.push({
        action: 'failed_login',
        timestamp: new Date(),
        ipAddress: deviceInfo.ip,
        userAgent: deviceInfo.browser,
        status: 'failure',
        details: {
          reason: 'Invalid password'
        }
      });

      // Increment login attempts and possibly lock account
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      user.lastLoginAttempt = new Date();
      
      // Only lock account if user is not a superadmin
      if (user.loginAttempts >= 3 && user.role !== 'super_admin') {
        user.accountLockout = {
          isLocked: true,
          lockedAt: new Date(),
          lockedReason: 'Too many failed login attempts',
          unlockAt: null // Permanent lock until admin unlocks
        };

        user.securityLog.push({
          action: 'account_locked',
          timestamp: new Date(),
          ipAddress: deviceInfo.ip,
          userAgent: deviceInfo.browser,
          status: 'success',
          details: {
            reason: 'Too many failed login attempts',
            lockedBy: 'system'
          }
        });
      }
      
      await user.save();
      throw new Error('Invalid username or password');
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lastLoginAttempt = null;

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role,
        requirePasswordChange: user.requirePasswordChange
      },
      jwtSecretKey,
      { expiresIn: '24h' }
    );

    // Add new session
    const sessionData = {
      token,
      deviceInfo: {
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ip: deviceInfo.ip
      },
      loginAt: new Date(),
      lastActive: new Date(),
      isActive: true
    };

    await user.addSession(sessionData);

    // Update last successful login
    user.lastSuccessfulLogin = {
      timestamp: new Date(),
      ipAddress: deviceInfo.ip,
      userAgent: deviceInfo.browser
    };
    
    // Log successful login
    user.securityLog.push({
      action: 'login',
      timestamp: new Date(),
      ipAddress: deviceInfo.ip,
      userAgent: deviceInfo.browser,
      status: 'success'
    });

    await user.save();

    // Get the base URL for profile picture
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const profilePictureUrl = user.profilePicture ? `${baseUrl}${user.profilePicture}` : null;

    return {
      token,
      user: {
        createdBy: user.createdBy ? { id: user.createdBy._id, username: user.createdBy.username } : null,
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastSuccessfulLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        permissions: {
          ...user.isSuperAdmin ? getUserPermissions('super_admin') : getUserPermissions(user.role),
          virtual: user.permissions.virtual,
          personal: user.permissions.personal,
          internationalPersonal: user.permissions.internationalPersonal,
          internationalVirtual: user.permissions.internationalVirtual,
        },
        isSuperAdmin: user.isSuperAdmin,
        apiKey: user.apiKey ? '********' + user.apiKey.slice(-4) : null,
        branding: user.branding,
        whatsappNumbers: user.whatsappNumbers,
        messageLimits: user.messageLimits,
        senderIds: user.senderIds,
        requirePasswordChange: user.requirePasswordChange,
        profilePicture: profilePictureUrl || null
      }
    };
  } catch (error) {
    throw error;
  }
};

// Add new method to unblock user account
const unblockUser = async (userId, adminId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const admin = await User.findById(adminId);
    if (!admin || !['super_admin', 'admin'].includes(admin.role)) {
      throw new Error('Unauthorized to perform this action');
    }

    user.isBlocked = false;
    user.blockedReason = null;
    user.loginAttempts = 0;
    user.lastLoginAttempt = null;

    // Add audit log
    user.auditLog.push({
      action: 'account_unblocked',
      details: {
        unblocked_by: adminId,
        systemInitiated: true
      }
    });

    await user.save();

    return {
      success: true,
      message: 'User account unblocked successfully'
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

    // Get role-based permissions based on the assigned role
    const defaultRolePermissions = getUserPermissions(userData.role || 'user');

    // Create new user with optional fields and both permission types
    const user = new User({
      username: userData.username,
      password: userData.password,
      email: userData.email || undefined,
      firstName: userData.firstName || undefined,
      lastName: userData.lastName || undefined,
      mobileNumber: userData.mobileNumber || undefined,
      role: userData.role || 'user',
      profilePicture: userData.profilePicture || null,
      // UI-specific permissions
      permissions: {
        virtual: userData.permissions?.virtual || false,
        personal: userData.permissions?.personal || false,
        internationalPersonal: userData.permissions?.internationalPersonal || false,
        internationalVirtual: userData.permissions?.internationalVirtual || false
      },
      // Role-based permissions
      rolePermissions: userData.rolePermissions || defaultRolePermissions,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      canCreateUsers: defaultRolePermissions.canCreateUsers,
      createdBy: creatorId,
      requirePasswordChange: false // Removed forced password change
    });

    // Save user
    await user.save();
    
    // Format the response
    return {
      success: true,
      message: 'User created successfully',
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        createdBy: creatorId,
        permissions: {
          ui: user.permissions,
          role: user.rolePermissions
        },
        canCreateUsers: user.canCreateUsers,
        // Include additional user settings but exclude sensitive data
        branding: user.branding || {},
        whatsappNumbers: user.whatsappNumbers || [],
        messageLimits: user.messageLimits || {},
        senderIds: user.senderIds || [],
        requirePasswordChange: user.requirePasswordChange,
        profilePicture: user.profilePicture
      }
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

    // Prevent super admin role from being changed
    if (user.role === 'super_admin' && updateData.role && updateData.role !== 'super_admin') {
      throw new Error('Super admin role cannot be changed.');
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

// Change password with security checks
const changePassword = async ({ userId, currentPassword, newPassword }) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Check password strength
    if (!validatePasswordStrength(newPassword)) {
      throw new ApiError(400, 'Password does not meet security requirements');
    }

    // Check if new password was used before
    const previousPasswords = user.previousPasswords || [];
    for (const prevPass of previousPasswords) {
      const isSamePassword = await bcrypt.compare(newPassword, prevPass.password);
      if (isSamePassword) {
        throw new ApiError(400, 'Cannot reuse previous passwords');
      }
    }

    // Store current password in history
    previousPasswords.push({
      password: user.password,
      changedAt: new Date()
    });

    // Keep only last 5 passwords
    if (previousPasswords.length > 5) {
      previousPasswords.shift();
    }

    // Update password
    user.password = newPassword;
    user.passwordLastChanged = new Date();
    user.requirePasswordChange = false;
    user.previousPasswords = previousPasswords;

    // Log password change
    user.securityLog.push({
      action: 'password_change',
      timestamp: new Date(),
      status: 'success'
    });

    await user.save();
    return { message: 'Password updated successfully' };
  } catch (error) {
    throw error;
  }
};

// Force password reset for a user (admin function)
const forcePasswordReset = async (userId, adminId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'super_admin') {
      throw new ApiError(403, 'Not authorized to force password reset');
    }

    user.requirePasswordChange = true;
    user.securityLog.push({
      action: 'password_reset',
      timestamp: new Date(),
      status: 'success',
      details: {
        initiatedBy: adminId
      }
    });

    await user.save();
    return { message: 'Password reset requirement set successfully' };
  } catch (error) {
    throw error;
  }
};

// Get security audit log
const getSecurityAuditLog = async (userId, adminId) => {
  try {
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'super_admin') {
      throw new ApiError(403, 'Not authorized to view security logs');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return {
      securityLog: user.securityLog,
      accountLockout: user.accountLockout,
      lastSuccessfulLogin: user.lastSuccessfulLogin,
      passwordLastChanged: user.passwordLastChanged,
      loginAttempts: user.loginAttempts
    };
  } catch (error) {
    throw error;
  }
};

// Get active sessions for a user
const getActiveSessions = async (userId, adminId) => {
  try {
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'super_admin') {
      throw new ApiError(403, 'Not authorized to view active sessions');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return {
      activeSessions: user.sessions || [],
      totalSessions: (user.sessions || []).length
    };
  } catch (error) {
    throw error;
  }
};

// Lock user account
const lockAccount = async (userId, adminId) => {
  try {
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'super_admin') {
      throw new ApiError(403, 'Not authorized to lock accounts');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Set account lockout
    user.accountLockout = {
      isLocked: true,
      lockedAt: new Date(),
      lockedReason: 'Locked by admin',
      unlockAt: null // Permanent lock until manually unlocked
    };

    // Log the action
    user.securityLog.push({
      action: 'account_locked',
      timestamp: new Date(),
      status: 'success',
      details: {
        lockedBy: adminId,
        reason: 'Locked by admin'
      }
    });

    await user.save();
    return { message: 'Account locked successfully' };
  } catch (error) {
    throw error;
  }
};

// Unlock user account
const unlockAccount = async (userId, adminId) => {
  try {
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'super_admin') {
      throw new ApiError(403, 'Not authorized to unlock accounts');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Remove account lockout
    user.accountLockout = {
      isLocked: false,
      lockedAt: null,
      lockedReason: null,
      unlockAt: null
    };

    // Reset login attempts
    user.loginAttempts = 0;
    user.lastLoginAttempt = null;

    // Log the action
    user.securityLog.push({
      action: 'account_unlocked',
      timestamp: new Date(),
      status: 'success',
      details: {
        unlockedBy: adminId
      }
    });

    await user.save();
    return { message: 'Account unlocked successfully' };
  } catch (error) {
    throw error;
  }
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
  // Admin can see users only if they have canViewAllUsers permission
  else if (requester.role === 'admin') {
    if (!requester.rolePermissions?.canViewAllUsers) {
      throw new ApiError(403, 'Not authorized to view users');
    }
    // Admins with permission can see users they created and users below their role
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
      .populate('createdBy', 'username')
    
  // Get the base URL for profile pictures
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  return users.map(user => {
    const userObj = user.toObject();
    return {
      ...userObj,
      profilePicture: user.profilePicture ? `${baseUrl}${user.profilePicture}` : null,
      createdBy: user.createdBy ? { id: user.createdBy._id, username: user.createdBy.username } : null // Keep the original createdBy ID for backward compatibility
    };
  });
};

// Logout service
const logout = async (userId, token) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Find and remove the session
    const session = user.sessions.find(s => s.token === token);
    if (!session) {
      throw new ApiError(400, 'Session not found');
    }

    // Mark session as inactive
    session.isActive = false;
    session.logoutAt = new Date();

    // Log the logout action
    user.securityLog.push({
      action: 'logout',
      timestamp: new Date(),
      ipAddress: session.deviceInfo.ip,
      userAgent: session.deviceInfo.browser,
      status: 'success'
    });

    await user.save();
    return { message: 'Logged out successfully' };
  } catch (error) {
    throw error;
  }
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

// Admin change user password
const adminChangeUserPassword = async (adminId, userId, newPassword) => {
  try {
    const admin = await User.findById(adminId);
    if (!admin || !['super_admin', 'admin'].includes(admin.role)) {
      throw new ApiError(403, 'Not authorized to change user passwords');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check password strength
    if (!validatePasswordStrength(newPassword)) {
      throw new ApiError(400, 'Password does not meet security requirements');
    }

    // Store current password in history
    const previousPasswords = user.previousPasswords || [];
    previousPasswords.push({
      password: user.password,
      changedAt: new Date()
    });

    // Keep only last 5 passwords
    if (previousPasswords.length > 5) {
      previousPasswords.shift();
    }

    // Update password
    user.password = newPassword;
    user.passwordLastChanged = new Date();
    user.previousPasswords = previousPasswords;

    // Log password change
    user.securityLog.push({
      action: 'password_change',
      timestamp: new Date(),
      status: 'success',
      details: {
        changedBy: adminId,
        changedByRole: admin.role
      }
    });

    await user.save();
    return { message: 'Password updated successfully' };
  } catch (error) {
    throw error;
  }
};

// Get all user credentials (super admin only)
const getAllUserCredentials = async (adminId) => {
  try {
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'super_admin') {
      throw new ApiError(403, 'Not authorized to view user credentials');
    }

    const users = await User.find({}, {
      username: 1,
      password: 1,
      role: 1,
      email: 1,
      firstName: 1,
      lastName: 1,
      mobileNumber: 1,
      isActive: 1,
      passwordLastChanged: 1
    });

    return users;
  } catch (error) {
    throw error;
  }
};

// Update user profile picture
const updateProfilePicture = async (userId, filePath) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If there's an existing profile picture, delete it
    if (user.profilePicture) {
      const oldFilePath = path.join(__dirname, '..', user.profilePicture);
      try {
        await fs.unlink(oldFilePath);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
      }
    }

    // Update the profile picture path with the relative path
    const relativePath = filePath.replace(/\\/g, '/'); // Convert Windows paths to forward slashes
    user.profilePicture = relativePath;
    await user.save();

    // Return the full URL for the profile picture
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const fullUrl = `${baseUrl}${relativePath}`;

    return {
      ...user.toObject(),
      profilePicture: fullUrl
    };
  } catch (error) {
    console.error('Error in updateProfilePicture:', error);
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
  revokeApiKey,
  getSecurityAuditLog,
  getActiveSessions,
  forcePasswordReset,
  lockAccount,
  unlockAccount,
  adminChangeUserPassword,
  getAllUserCredentials,
  updateProfilePicture
};
