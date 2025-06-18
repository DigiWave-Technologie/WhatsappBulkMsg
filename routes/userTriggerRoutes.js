const express = require('express');
const router = express.Router();
const userTriggerController = require('../controllers/userTriggerController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Super Admin and Admin routes
router.post('/', authorizeRole('super_admin', 'admin'), userTriggerController.createTrigger);
router.put('/:id', authorizeRole('super_admin', 'admin'), userTriggerController.updateTrigger);
router.delete('/:id', authorizeRole('super_admin', 'admin'), userTriggerController.deleteTrigger);

// All authenticated users can view triggers
router.get('/', userTriggerController.getTriggers);
router.get('/:id', userTriggerController.getTriggerById);

module.exports = router; 