const creditService = require("../services/creditsService");
const { checkPermission } = require('../utils/permissions');
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Transfer credits between users
const transferCredit = async (req, res) => {
  try {
    const { toUserId, categoryId, creditAmount, description } = req.body;
    const fromUserId = req.user.userId; // Get from authenticated user

    if (!toUserId || !categoryId || !creditAmount) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const result = await creditService.transferCredits(
      fromUserId,
      toUserId,
      categoryId,
      creditAmount,
      description
    );

    return res.status(200).json({
      success: true,
      message: 'Credits transferred successfully',
      data: result
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Debit credits from user
const debitCredit = async (req, res) => {
  try {
    const { categoryId, creditAmount, campaignId } = req.body;
    const userId = req.user.userId; // Get from authenticated user

    if (!categoryId || !creditAmount) {
      return res.status(400).json({ error: "Category ID and credit amount are required." });
    }

    const result = await creditService.debitCredits(
      userId,
      categoryId,
      creditAmount,
      campaignId
    );

    return res.status(200).json({
      success: true,
      message: 'Credits debited successfully',
      data: result
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Get user's credit balance
const getUserCreditsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;
    const result = await creditService.getUserCreditBalance(userId);
    
    res.status(200).json({ 
      success: true,
      message: 'User credits retrieved successfully', 
      data: result 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get credit transactions
const getCreditsTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = req.query; // Get filters from query params

    const result = await creditService.getCreditTransactions(userId, filters);
    
    res.status(200).json({
      success: true,
      message: 'Credit transactions retrieved successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get credit usage statistics
const getCreditUsageStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = req.query; // Get filters from query params

    const result = await creditService.getCreditUsageStats(userId, filters);
    
    res.status(200).json({
      success: true,
      message: 'Credit usage statistics retrieved successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user's credit balance
const getUserCreditBalance = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;
    const credits = await creditService.getUserCreditBalance(userId);
    
    res.status(200).json({
      success: true,
      message: 'User credit balance retrieved successfully',
      data: credits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Check user credits
const checkUserCredits = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;
    const result = await creditService.getUserCreditBalance(userId);
    
    res.status(200).json({
      success: true,
      message: 'User credits retrieved successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user's credit categories
const getUserCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await creditService.getUserCategories(userId);
    
    res.status(200).json({
      success: true,
      message: 'User credit categories retrieved successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Decrement credits by user
const decrementCreditByUser = async (req, res) => {
  try {
    const { categoryId, amount } = req.body;
    const userId = req.user.userId;

    if (!categoryId || !amount) {
      return res.status(400).json({ error: "Category ID and amount are required." });
    }

    const result = await creditService.decrementCredits(userId, categoryId, amount);
    
    res.status(200).json({
      success: true,
      message: 'Credits decremented successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get credit transactions for a specific user
const getCreditsTransactionByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const filters = req.query;

    const result = await creditService.getCreditsTransactionByUserId(userId, filters);
    
    res.status(200).json({
      success: true,
      message: 'User credit transactions retrieved successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get credit transactions for a specific user and category
const getCreditsTransactionByUserIdCategoryId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const categoryId = req.params.categoryId;
    const filters = req.query;

    const result = await creditService.getCreditsTransactionByUserIdCategoryId(userId, categoryId, filters);
    
    res.status(200).json({
      success: true,
      message: 'User credit transactions by category retrieved successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add credits to user
const addCredits = async (req, res) => {
  try {
    const { userId, categoryId, amount } = req.body;

    if (!userId || !categoryId || !amount) {
      return res.status(400).json({ 
        success: false,
        error: "User ID, category ID, and amount are required." 
      });
    }

    // Check if user has permission to add credits
    if (req.user.role !== 'super_admin' && !req.user.permissions.canManageAllCredits) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to add credits"
      });
    }

    const result = await creditService.addCredit(userId, categoryId, amount);
    
    res.status(200).json({
      success: true,
      message: 'Credits added successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  transferCredit,
  debitCredit,
  getUserCreditsByUserId,
  getCreditsTransaction,
  getCreditUsageStats,
  getUserCreditBalance,
  checkUserCredits,
  getUserCategory,
  decrementCreditByUser,
  getCreditsTransactionByUserId,
  getCreditsTransactionByUserIdCategoryId,
  addCredits
};
