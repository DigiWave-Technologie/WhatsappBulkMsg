const msgGroupService = require('../services/msgGroupService');

// Add a new group
const addGroup = async (req, res) => {
    try {
        const groupData = req.body;
        const result = await msgGroupService.addGroup(groupData);
        res.status(201).json({ message: "Group added successfully", data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a group by ID
const updateGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const groupData = req.body;
        const result = await msgGroupService.updateGroup(groupId, groupData);
        res.status(200).json({ message: "Group updated successfully", data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a group by ID
const deleteGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const result = await msgGroupService.deleteGroup(groupId);
        res.status(200).json({ message: "Group deleted successfully", data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a group by ID
const getGroupById = async (req, res) => {
    try {
        const groupId = req.params.id;
        const result = await msgGroupService.getGroupById(groupId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all groups for a user
const getGroupsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await msgGroupService.getGroupsByUserId(userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all groups
const getAllGroups = async (req, res) => {
    try {
        const result = await msgGroupService.getAllGroups();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    getGroupsByUserId,
    getAllGroups,
};
