const db = require('../config/database');

/**
 * Create a new contact group
 */
const createGroup = async (userId, groupData) => {
  try {
    // Validate group data
    if (!groupData.name || !groupData.contacts || !Array.isArray(groupData.contacts)) {
      throw new Error('Missing required group fields');
    }

    // Insert group into database
    const query = `
      INSERT INTO contact_groups (
        userId,
        name,
        contacts,
        description,
        createdAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      userId,
      groupData.name,
      JSON.stringify(groupData.contacts),
      groupData.description || ''
    ];

    return new Promise((resolve, reject) => {
      db.query(query, params, (err, result) => {
        if (err) {
          reject('Error creating group');
        }
        resolve(result.insertId);
      });
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get groups by user ID
 */
const getGroups = async (userId) => {
  try {
    const query = `
      SELECT * FROM contact_groups
      WHERE userId = ?
      ORDER BY createdAt DESC
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [userId], (err, results) => {
        if (err) {
          reject('Error fetching groups');
        }
        resolve(results);
      });
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get group by ID
 */
const getGroupById = async (userId, groupId) => {
  try {
    const query = `
      SELECT * FROM contact_groups
      WHERE groupId = ?
      AND userId = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [groupId, userId], (err, results) => {
        if (err) {
          reject('Error fetching group');
        }
        resolve(results[0]);
      });
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update group
 */
const updateGroup = async (userId, groupId, groupData) => {
  try {
    // Check if group exists
    const group = await getGroupById(userId, groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Update group in database
    const query = `
      UPDATE contact_groups
      SET 
        name = ?,
        contacts = ?,
        description = ?,
        updatedAt = NOW()
      WHERE groupId = ?
      AND userId = ?
    `;

    const params = [
      groupData.name,
      JSON.stringify(groupData.contacts),
      groupData.description || '',
      groupId,
      userId
    ];

    return new Promise((resolve, reject) => {
      db.query(query, params, (err, result) => {
        if (err) {
          reject('Error updating group');
        }
        resolve(result);
      });
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Delete group
 */
const deleteGroup = async (userId, groupId) => {
  try {
    // Check if group exists
    const group = await getGroupById(userId, groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Delete group from database
    const query = `
      DELETE FROM contact_groups
      WHERE groupId = ?
      AND userId = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [groupId, userId], (err, result) => {
        if (err) {
          reject('Error deleting group');
        }
        resolve(result);
      });
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Add contacts to group
 */
const addContactsToGroup = async (userId, groupId, contacts) => {
  try {
    // Check if group exists
    const group = await getGroupById(userId, groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Parse existing contacts
    const existingContacts = JSON.parse(group.contacts);

    // Add new contacts
    const updatedContacts = [...existingContacts, ...contacts];

    // Update group with new contacts
    const query = `
      UPDATE contact_groups
      SET 
        contacts = ?,
        updatedAt = NOW()
      WHERE groupId = ?
      AND userId = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [JSON.stringify(updatedContacts), groupId, userId], (err, result) => {
        if (err) {
          reject('Error adding contacts to group');
        }
        resolve(result);
      });
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Remove contacts from group
 */
const removeContactsFromGroup = async (userId, groupId, contacts) => {
  try {
    // Check if group exists
    const group = await getGroupById(userId, groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Parse existing contacts
    const existingContacts = JSON.parse(group.contacts);

    // Remove specified contacts
    const updatedContacts = existingContacts.filter(contact => !contacts.includes(contact));

    // Update group with remaining contacts
    const query = `
      UPDATE contact_groups
      SET 
        contacts = ?,
        updatedAt = NOW()
      WHERE groupId = ?
      AND userId = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [JSON.stringify(updatedContacts), groupId, userId], (err, result) => {
        if (err) {
          reject('Error removing contacts from group');
        }
        resolve(result);
      });
    });
  } catch (error) {
    throw error;
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