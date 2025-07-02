const authService = require("../services/authService");
const { getClientIp } = require('request-ip');
const UAParser = require('ua-parser-js');

const userLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Get device info
    const ua = new UAParser(req.headers['user-agent']);
    const deviceInfo = {
      deviceType: ua.getDevice().type || 'desktop',
      browser: ua.getBrowser().name,
      os: ua.getOS().name,
      ip: getClientIp(req)
    };

    const result = await authService.userLogin({ username, password }, deviceInfo);
    
    // Set token in cookie for frontend use
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        ...result,
        requirePasswordChange: result.user.requirePasswordChange
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

const modifyPassword = async (req, res) => {
  try {
    const { email, password_hash, newpassword } = req.body;
    const result = await authService.modifyPassword({ email, password_hash, newpassword });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    console.log('req.body:', req.body); // Log request body
    console.log('req.file:', req.file); // Log request file

    const userData = req.body;
    const creatorId = req.user.userId; // From auth middleware
    const profilePicturePath = req.file ? req.file.path : null; // Get file path if uploaded

    // Parse permissions and rolePermissions from JSON strings if they exist
    if (userData.permissions && typeof userData.permissions === 'string') {
      try {
        userData.permissions = JSON.parse(userData.permissions);
      } catch (e) {
        throw new SyntaxError('Invalid JSON format for permissions');
      }
    }
    if (userData.rolePermissions && typeof userData.rolePermissions === 'string') {
      try {
        userData.rolePermissions = JSON.parse(userData.rolePermissions);
      } catch (e) {
        throw new SyntaxError('Invalid JSON format for rolePermissions');
      }
    }

    // Pass user data and profile picture path to service
    const result = await authService.createUser({...userData, profilePicture: profilePicturePath }, creatorId);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result
    });
  } catch (error) {
    // If JSON parsing fails, send a 400 response
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: error
      });
    }
    console.error('Error creating user:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updaterId = req.user.userId; // From auth middleware
    const result = await authService.updateUser({ id, ...updateData }, updaterId);
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const uploadUserLogo = async (req, res) => {
  try {
    const { logo } = req.body;
    const userId = req.user.userId; // Assuming middleware sets user info
    const result = await authService.uploadUserLogo({ logo }, userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await authService.deleteUser(id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const requesterId = req.user.userId; // From auth middleware
    const result = await authService.getAllUsers(requesterId);
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId; // From auth middleware
    const result = await authService.changePassword({ userId, currentPassword, newPassword });
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const forcePasswordReset = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;
    const result = await authService.forcePasswordReset(userId, adminId);
    res.status(200).json({
      success: true,
      message: 'Password reset requirement set successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getSecurityAudit = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;
    const result = await authService.getSecurityAuditLog(userId, adminId);
    res.status(200).json({
      success: true,
      message: 'Security audit retrieved successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const token = req.headers.authorization?.split(' ')[1];
    const result = await authService.logout(userId, token);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getSecurityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;
    const result = await authService.getSecurityAuditLog(userId, adminId);
    res.status(200).json({
      success: true,
      message: 'Security logs retrieved successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;
    const result = await authService.getActiveSessions(userId, adminId);
    res.status(200).json({
      success: true,
      message: 'Active sessions retrieved successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const unlockAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;
    const result = await authService.unlockAccount(userId, adminId);
    res.status(200).json({
      success: true,
      message: 'Account unlocked successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const lockAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;
    const result = await authService.lockAccount(userId, adminId);
    res.status(200).json({
      success: true,
      message: 'Account locked successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Generate API key for a user
const generateApiKey = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const result = await authService.generateApiKey(userId);
    res.status(200).json({
      success: true,
      message: 'API key generated successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Revoke API key for a user
const revokeApiKey = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const result = await authService.revokeApiKey(userId);
    res.status(200).json({
      success: true,
      message: 'API key revoked successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const adminChangeUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const adminId = req.user.userId;

    const result = await authService.adminChangeUserPassword(adminId, userId, newPassword);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

const getAllUserCredentials = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const users = await authService.getAllUserCredentials(adminId);
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

// Update user profile picture
const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Create the file path relative to the uploads directory
    const filePath = `/uploads/profile-pictures/${req.file.filename}`;
    
    const user = await authService.updateProfilePicture(userId, filePath);

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile picture',
      error: error.message
    });
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
  forcePasswordReset,
  getSecurityAudit,
  logout,
  getSecurityLogs,
  getActiveSessions,
  unlockAccount,
  lockAccount,
  generateApiKey,
  revokeApiKey,
  adminChangeUserPassword,
  getAllUserCredentials,
  updateProfilePicture
};
