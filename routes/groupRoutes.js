const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/auth');

// Create a new group
router.post('/', authenticateToken, groupController.createGroup);

// Get all groups
router.get('/', authenticateToken, groupController.getGroups);

// Get group by ID
router.get('/:groupId', authenticateToken, groupController.getGroupById);

// Update group
router.put('/:groupId', authenticateToken, groupController.updateGroup);

// Delete group
router.delete('/:groupId', authenticateToken, groupController.deleteGroup);

// Add contacts to group
router.post('/:groupId/contacts', authenticateToken, groupController.addContactsToGroup);

// Remove contacts from group
router.delete('/:groupId/contacts', authenticateToken, groupController.removeContactsFromGroup);

module.exports = router; 