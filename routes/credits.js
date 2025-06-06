const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    getCreditBalance,
    addCredits,
    getCreditsTransactionByUserId,
    getCreditsTransactionByUserIdCategoryId,
    getCampaignTypeCreditBalance
} = require('../controllers/creditsController');

// Get campaign type credit balance
router.get('/campaign-balance', auth, getCampaignTypeCreditBalance);

module.exports = router; 