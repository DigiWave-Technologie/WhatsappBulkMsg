const express = require('express');
const router = express.Router();
const metaApiService = require('../services/metaApiService');

// Test endpoint
router.post('/test-message', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    const result = await metaApiService.sendMessage(phoneNumber, message);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;