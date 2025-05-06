const User = require('../models/User');

// Add a new group
const addGroup = async (groupData) => {
    const { userId, group_name, group_number } = groupData;
    try {
        const newGroup = new Group({ userId, group_name, group_number });
        await newGroup.save();
        return { groupId: newGroup._id };
    } catch (error) {
        throw new Error('Database operation failed: ' + error.message);
    }
};

// Update a group by ID
const updateGroup = async (groupId, groupData) => {
    const { group_name, group_number } = groupData;
    try {
        const updatedGroup = await Group.findByIdAndUpdate(groupId, { group_name, group_number }, { new: true });
        if (!updatedGroup) throw new Error('Group not found');
        return { affectedRows: 1 };
    } catch (error) {
        throw new Error('Database operation failed: ' + error.message);
    }
};

// Delete a group by ID
const deleteGroup = async (groupId) => {
    try {
        const deletedGroup = await Group.findByIdAndDelete(groupId);
        if (!deletedGroup) throw new Error('Group not found');
        return { affectedRows: 1 };
    } catch (error) {
        throw new Error('Database operation failed: ' + error.message);
    }
};

// Get a group by ID
const getGroupById = async (groupId) => {
    try {
        const group = await Group.findById(groupId);
        if (!group) throw new Error('Group not found');
        return group;
    } catch (error) {
        throw new Error('Database operation failed: ' + error.message);
    }
};

// Get all groups for a user
const getGroupsByUserId = async (userId) => {
    try {
        const groups = await Group.find({ userId });
        return groups;
    } catch (error) {
        throw new Error('Database operation failed: ' + error.message);
    }
};

// Get all groups
const getAllGroups = async () => {
    try {
        const groups = await Group.find();
        return groups;
    } catch (error) {
        throw new Error('Database operation failed: ' + error.message);
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
