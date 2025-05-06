const asyncHandler = require('../utils/asyncHandler');
const MessageLog = require('../models/MessageLog');
const CreditTransaction = require('../models/CreditTransaction');

// Get credit history
const getCreditHistory = asyncHandler(async (req, res) => {
    const userId = req.apiUser.id;
    const { startDate, endDate, type, page = 1, limit = 20 } = req.query;
    
    const query = { userId };
    
    if (type) query.type = type;
    
    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const transactions = await CreditTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    
    const total = await CreditTransaction.countDocuments(query);
    
    // Get summary statistics
    const stats = await CreditTransaction.aggregate([
        { $match: query },
        { $group: {
            _id: '$type',
            total: { $sum: '$amount' }
        }}
    ]);
    
    // Calculate credits added vs used
    const creditsAdded = stats.find(s => s._id === 'add' || s._id === 'purchase')?.total || 0;
    const creditsUsed = stats.filter(s => s._id !== 'add' && s._id !== 'purchase')
        .reduce((sum, item) => sum + item.total, 0);
    
    res.status(200).json({
        success: true,
        data: {
            transactions,
            summary: {
                creditsAdded,
                creditsUsed,
                types: stats.map(s => ({ type: s._id, total: s.total }))
            },
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
});

// Add a general reports endpoint for overall API usage statistics
const getGeneralReports = asyncHandler(async (req, res) => {
    const userId = req.apiUser.id;
    const { startDate, endDate } = req.query;
    
    const dateQuery = {};
    if (startDate && endDate) {
        dateQuery.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    // Message statistics by type
    const messageStats = await MessageLog.aggregate([
        { $match: { userId, source: 'api', ...dateQuery } },
        { $group: {
            _id: { type: '$messageType', status: '$status' },
            count: { $sum: 1 }
        }},
        { $sort: { '_id.type': 1, '_id.status': 1 } }
    ]);
    
    // Credit usage by type
    const creditStats = await CreditTransaction.aggregate([
        { $match: { userId, ...dateQuery } },
        { $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
        }},
        { $sort: { total: -1 } }
    ]);
    
    // Daily message volume
    const dailyVolume = await MessageLog.aggregate([
        { $match: { userId, source: 'api', ...dateQuery } },
        { $group: {
            _id: { 
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        { $project: {
            _id: 0,
            date: {
                $dateToString: {
                    format: '%Y-%m-%d',
                    date: {
                        $dateFromParts: {
                            year: '$_id.year',
                            month: '$_id.month',
                            day: '$_id.day'
                        }
                    }
                }
            },
            count: 1
        }}
    ]);
    
    // Success rate calculation
    const successStats = messageStats.reduce((acc, stat) => {
        const type = stat._id.type;
        const status = stat._id.status;
        const count = stat.count;
        
        if (!acc[type]) {
            acc[type] = { total: 0, success: 0 };
        }
        
        acc[type].total += count;
        if (['sent', 'delivered', 'read'].includes(status)) {
            acc[type].success += count;
        }
        
        return acc;
    }, {});
    
    const successRates = Object.entries(successStats).map(([type, data]) => ({
        type,
        successRate: data.total > 0 ? (data.success / data.total * 100).toFixed(2) + '%' : '0%',
        total: data.total,
        successful: data.success
    }));
    
    res.status(200).json({
        success: true,
        data: {
            messageStats: messageStats.map(stat => ({
                type: stat._id.type,
                status: stat._id.status,
                count: stat.count
            })),
            creditUsage: creditStats.map(stat => ({
                type: stat._id,
                total: stat.total,
                count: stat.count
            })),
            dailyVolume,
            successRates
        }
    });
});

// Message sending functions
const sendMessage = asyncHandler(async (req, res) => {
    const { phoneNumber, message } = req.body;
    const userId = req.apiUser.id;

    // Implementation for sending message
    const result = await MessageLog.create({
        userId,
        phoneNumber,
        message,
        status: 'pending',
        source: 'api'
    });

    res.status(200).json({
        success: true,
        message: 'Message queued for sending',
        data: result
    });
});

const sendTemplateMessage = asyncHandler(async (req, res) => {
    const { phoneNumber, templateId, parameters } = req.body;
    const userId = req.apiUser.id;

    // Implementation for sending template message
    const result = await MessageLog.create({
        userId,
        phoneNumber,
        templateId,
        parameters,
        status: 'pending',
        source: 'api',
        messageType: 'template'
    });

    res.status(200).json({
        success: true,
        message: 'Template message queued for sending',
        data: result
    });
});

const sendMediaMessage = asyncHandler(async (req, res) => {
    const { phoneNumber, mediaUrl, caption } = req.body;
    const userId = req.apiUser.id;

    // Implementation for sending media message
    const result = await MessageLog.create({
        userId,
        phoneNumber,
        mediaUrl,
        caption,
        status: 'pending',
        source: 'api',
        messageType: 'media'
    });

    res.status(200).json({
        success: true,
        message: 'Media message queued for sending',
        data: result
    });
});

// Account & balance functions
const getBalance = asyncHandler(async (req, res) => {
    const userId = req.apiUser.id;
    const credits = await CreditTransaction.aggregate([
        { $match: { userId } },
        { $group: {
            _id: null,
            total: { $sum: '$amount' }
        }}
    ]);

    res.status(200).json({
        success: true,
        data: {
            balance: credits[0]?.total || 0
        }
    });
});

const getUsageHistory = asyncHandler(async (req, res) => {
    const userId = req.apiUser.id;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const query = { userId };
    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await MessageLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await MessageLog.countDocuments(query);

    res.status(200).json({
        success: true,
        data: {
            messages,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
});

// Group management functions
const createGroup = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.apiUser.id;

    // Implementation for creating group
    res.status(200).json({
        success: true,
        message: 'Group created successfully'
    });
});

const getGroups = asyncHandler(async (req, res) => {
    const userId = req.apiUser.id;
    // Implementation for getting groups
    res.status(200).json({
        success: true,
        data: []
    });
});

const updateGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { name, description } = req.body;
    // Implementation for updating group
    res.status(200).json({
        success: true,
        message: 'Group updated successfully'
    });
});

const deleteGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    // Implementation for deleting group
    res.status(200).json({
        success: true,
        message: 'Group deleted successfully'
    });
});

const addContactsToGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { contacts } = req.body;
    // Implementation for adding contacts to group
    res.status(200).json({
        success: true,
        message: 'Contacts added to group successfully'
    });
});

// Template management functions
const createTemplate = asyncHandler(async (req, res) => {
    const { name, content, category } = req.body;
    const userId = req.apiUser.id;
    // Implementation for creating template
    res.status(200).json({
        success: true,
        message: 'Template created successfully'
    });
});

const getTemplates = asyncHandler(async (req, res) => {
    const userId = req.apiUser.id;
    // Implementation for getting templates
    res.status(200).json({
        success: true,
        data: []
    });
});

const updateTemplate = asyncHandler(async (req, res) => {
    const { templateId } = req.params;
    const { name, content, category } = req.body;
    // Implementation for updating template
    res.status(200).json({
        success: true,
        message: 'Template updated successfully'
    });
});

const deleteTemplate = asyncHandler(async (req, res) => {
    const { templateId } = req.params;
    // Implementation for deleting template
    res.status(200).json({
        success: true,
        message: 'Template deleted successfully'
    });
});

// Number validation function
const validateNumbers = asyncHandler(async (req, res) => {
    const { numbers } = req.body;
    // Implementation for validating numbers
    res.status(200).json({
        success: true,
        data: numbers.map(number => ({
            number,
            valid: true,
            type: 'mobile'
        }))
    });
});

// Reports functions
const getMessageReports = asyncHandler(async (req, res) => {
    const userId = req.apiUser.id;
    const { startDate, endDate } = req.query;
    // Implementation for getting message reports
    res.status(200).json({
        success: true,
        data: []
    });
});

const getCampaignReports = asyncHandler(async (req, res) => {
    const userId = req.apiUser.id;
    const { startDate, endDate } = req.query;
    // Implementation for getting campaign reports
    res.status(200).json({
        success: true,
        data: []
    });
});

module.exports = {
    // Message sending endpoints
    sendMessage,
    sendTemplateMessage,
    sendMediaMessage,
    
    // Account & balance endpoints
    getBalance,
    getUsageHistory,
    getCreditHistory,
    
    // Group management endpoints
    createGroup,
    getGroups,
    updateGroup,
    deleteGroup,
    addContactsToGroup,
    
    // Template management endpoints
    createTemplate,
    getTemplates,
    updateTemplate,
    deleteTemplate,
    
    // Number validation endpoint
    validateNumbers,
    
    // Reports endpoints
    getMessageReports,
    getCampaignReports,
    getGeneralReports
};