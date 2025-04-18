const creditService = require("../services/creditsService");
const { checkPermission } = require('../utils/permissions');
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Add a user credit
const transferCredit = async (req, res) => {
  try {
    const { fromUserId, toUserId, categoryId, creditAmount } = req.body;

    if (!fromUserId || !toUserId || !categoryId || !creditAmount) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if user has permission to transfer credits
    if (!checkPermission(req.user, 'transfer_credits')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const result = await creditService.handleCreditTransfer(
      fromUserId,
      toUserId,
      categoryId,
      creditAmount
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const debitCredit = async (req, res) => {
  const { fromUserId, toUserId, categoryId, creditAmount } = req.body;

  if (!fromUserId || !toUserId || !categoryId || !creditAmount) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const result = await creditService.handleDebit(
      fromUserId,
      toUserId,
      categoryId,
      creditAmount
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const getUserCreditsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await creditService.getUserCreditsByUserId(userId);
    
    if (result.length > 0) {
      res.status(200).json({ 
        success: true,
        message: 'User credits found', 
        data: result 
      });
    } else {
      res.status(404).json({ 
        success: false,
        message: 'No credits found for this user' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const getCreditsTransaction = async (req, res) => {
  try {
    // Check if user has permission to view all transactions
    if (!checkPermission(req.user, 'view_all_transactions')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const result = await creditService.getCreditsTransaction();
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

const getCreditsTransactionByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user has permission to view user transactions
    if (!checkPermission(req.user, 'view_user_transactions')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const result = await creditService.getCreditsTransactionByUserId(userId);
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

const getCreditsTransactionByUserIdCategoryId = async (req, res) => {
  try {
    const { userId, categoryId } = req.params;

    // Check if user has permission to view category transactions
    if (!checkPermission(req.user, 'view_category_transactions')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const result = await creditService.getCreditsTransactionByUserIdCategoryId(
      userId,
      categoryId
    );
    
    res.status(200).json({
      success: true,
      message: 'Category credit transactions retrieved successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getUserCategory = async (req, res) => {
  try {
    const result = await creditService.getUserCategory();
    if (result.length > 0) {
      res.status(200).json({ message: "Category Successfully", data: result });
    } else {
      res.status(404).json({ message: "No Transaction logs" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const decrementCreditByUser = async (req, res) => {
  const { userId, creditAmount } = req.body;

  if (!userId || !creditAmount) {
    return res
      .status(400)
      .json({ error: "userId and creditAmount are required." });
  }

  try {
    const result = await creditService.decrementCreditByUserId(
      userId,
      creditAmount
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Get credit usage statistics
const getCreditUsageStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await creditService.getCreditUsageStats(userId);
    
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
    const userId = req.params.userId;
    const result = await creditService.getUserCreditBalance(userId);
    
    res.status(200).json({
      success: true,
      message: 'User credit balance retrieved successfully',
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
  getCreditsTransactionByUserId,
  getCreditsTransactionByUserIdCategoryId,
  getUserCategory,
  decrementCreditByUser,
  getCreditUsageStats,
  getUserCreditBalance
};
