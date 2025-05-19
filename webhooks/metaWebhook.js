const express = require('express');
const router = express.Router();

// Verification endpoint
router.get('/', (req, res) => {
  const verifyToken = process.env.META_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === verifyToken) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Message handling endpoint
router.post('/', (req, res) => {
  const body = req.body;
  // Handle incoming messages
  console.log('Received webhook:', body);
  res.sendStatus(200);
});

module.exports = router;