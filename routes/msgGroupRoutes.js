const express = require('express');
const router = express.Router();
const msgGroupController = require('../controllers/msgGroupController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all group routes
router.post('/', authMiddleware, msgGroupController.addGroup);
router.get('/', authMiddleware, msgGroupController.getAllGroups);
router.get('/:id', authMiddleware, msgGroupController.getGroupById);
router.put('/:id', authMiddleware, msgGroupController.updateGroup);
router.delete('/:id', authMiddleware, msgGroupController.deleteGroup);

module.exports = router;
