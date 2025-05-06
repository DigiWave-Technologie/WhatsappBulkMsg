const groupService = require('../services/groupService');

/**
 * Create a new group
 */
const createGroup = async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupData = req.body;

    // Create group
    const groupId = await groupService.createGroup(userId, groupData);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { groupId }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get groups
 */
const getGroups = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get groups
    const groups = await groupService.getGroups(userId);

    res.status(200).json({
      success: true,
      data: groups
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get group by ID
 */
const getGroupById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;

    // Get group
    const group = await groupService.getGroupById(userId, groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update group
 */
const updateGroup = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const groupData = req.body;

    // Update group
    await groupService.updateGroup(userId, groupId, groupData);

    res.status(200).json({
      success: true,
      message: 'Group updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete group
 */
const deleteGroup = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;

    // Delete group
    await groupService.deleteGroup(userId, groupId);

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Add contacts to group
 */
const addContactsToGroup = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const { contacts } = req.body;

    // Add contacts to group
    await groupService.addContactsToGroup(userId, groupId, contacts);

    res.status(200).json({
      success: true,
      message: 'Contacts added to group successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Remove contacts from group
 */
const removeContactsFromGroup = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const { contacts } = req.body;

    // Remove contacts from group
    await groupService.removeContactsFromGroup(userId, groupId, contacts);

    res.status(200).json({
      success: true,
      message: 'Contacts removed from group successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addContactsToGroup,
  removeContactsFromGroup
}; 