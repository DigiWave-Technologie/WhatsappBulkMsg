const dbconnection = require('../config/database');

const addCampaign = async (campaignData) => {
    const { campaign_title, message, numbers, media_url, group_id, status } = campaignData;

    try {
        const connection = await dbconnection.getConnection(); // Get a connection from the pool

        const query = `
            INSERT INTO campaigns (campaign_title, message, numbers, media_url, group_id, status, created_date)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await connection.execute(query, [
            campaign_title,
            message,
            JSON.stringify(numbers),
            JSON.stringify(media_url),
            group_id,
            JSON.stringify(status)
        ]);

        connection.release(); // Release the connection back to the pool

        return result.insertId; // Return the inserted campaign ID
    } catch (error) {
        throw new Error('Database query failed: ' + error.message);
    }
};
module.exports = { addCampaign }; // Export the function as a module