const authService = require("../services/authService");
const apiService = require("../services/apiService");
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
      data: result
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
    const userData = req.body;
    const creatorId = req.user.userId; // From auth middleware
    const result = await authService.createUser(userData, creatorId);
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result
    });
  } catch (error) {
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
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const requesterId = req.user.userId; // From auth middleware
    const result = await authService.getAllUsers(requesterId);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId; // From auth middleware
    const result = await authService.changePassword({ userId, currentPassword, newPassword });
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const token = req.headers.authorization.replace('Bearer ', '');
    const result = await authService.logout(userId, token);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

// Generate API key for a user
const generateApiKey = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const result = await apiService.generateApiKey(userId);
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
    const result = await apiService.revokeApiKey(userId);
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
  generateApiKey,
  revokeApiKey
};
