const Campaign = require('../models/Campaign');
const PersonalCampaign = require('../models/PersonalCampaign');
const InternationalCampaign = require('../models/InternationalCampaign');
const InternationalPersonalCampaign = require('../models/InternationalPersonalCampaign');
const Template = require('../models/Template');
const { calculateMessageCredits } = require('../utils/helpers');
const { ApiError } = require('../middleware/errorHandler');
const whatsappService = require('./whatsappService');
const creditService = require('./creditsService');
const config = require('../config/config');
const Credit = require('../models/Credit');
const MessageLog = require('../models/MessageLog');
const Group = require('../models/Group');

class CampaignService {
    // Create a new campaign
    async createCampaign(userId, campaignData) {
        const { name, templateId, groupId, scheduledAt } = campaignData;

        // Validate template and group
        const [template, group] = await Promise.all([
            Template.findOne({ _id: templateId, userId }),
            Group.findOne({ _id: groupId, userId })
        ]);

        if (!template) {
            throw new Error('Template not found');
        }

        if (!group) {
            throw new Error('Group not found');
        }

        // Create campaign
        const campaign = new Campaign({
            name,
            userId,
            templateId,
            groupId,
            scheduledAt,
            totalRecipients: group.contacts.length,
            status: scheduledAt ? 'scheduled' : 'draft'
        });

        await campaign.save();
        return campaign;
    }

    // Get campaigns with pagination and filters
    async getCampaigns(userId, filters = {}) {
        const query = { userId };

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.startDate && filters.endDate) {
            query.createdAt = {
                $gte: new Date(filters.startDate),
                $lte: new Date(filters.endDate)
            };
        }

        return Campaign.find(query)
            .populate('templateId', 'name content')
            .populate('groupId', 'name')
            .sort({ createdAt: -1 });
    }

    // Get campaign by ID
    async getCampaignById(userId, campaignId) {
        const campaign = await Campaign.findOne({ _id: campaignId, userId })
            .populate('templateId', 'name content')
            .populate('groupId', 'name');

        if (!campaign) {
            throw new Error('Campaign not found');
        }

        return campaign;
    }

    // Update campaign
    async updateCampaign(userId, campaignId, updateData) {
        const campaign = await Campaign.findOne({ _id: campaignId, userId });

        if (!campaign) {
            throw new Error('Campaign not found');
        }

        if (campaign.status !== 'draft') {
            throw new Error('Only draft campaigns can be updated');
        }

        Object.assign(campaign, updateData);
        await campaign.save();

        return campaign;
    }

    // Delete campaign
    async deleteCampaign(userId, campaignId) {
        const campaign = await Campaign.findOne({ _id: campaignId, userId });

        if (!campaign) {
            throw new Error('Campaign not found');
        }

        if (campaign.status !== 'draft') {
            throw new Error('Only draft campaigns can be deleted');
        }

        await campaign.remove();
    }

    // Start campaign
    async startCampaign(userId, campaignId) {
        const campaign = await Campaign.findOne({ _id: campaignId, userId })
            .populate('templateId')
            .populate('groupId');

        if (!campaign) {
            throw new Error('Campaign not found');
        }

        if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
            throw new Error('Campaign cannot be started');
        }

        if (campaign.status === 'scheduled' && campaign.scheduledAt > new Date()) {
            throw new Error('Campaign is scheduled for a future date');
        }

        // Check credits
        const requiredCredits = campaign.totalRecipients;
        const hasCredits = await creditService.checkCredits(userId, requiredCredits);

        if (!hasCredits) {
            throw new Error('Insufficient credits');
        }

        // Update campaign status
        campaign.status = 'running';
        campaign.startedAt = new Date();
        await campaign.save();

        // Start sending messages
        this.sendCampaignMessages(campaign);

        return campaign;
    }

    async sendCampaignMessages(campaign) {
        const { templateId, groupId } = campaign;

        for (const contact of groupId.contacts) {
            try {
                // Send message
                const message = await whatsappService.sendTemplate(
                    contact.phone,
                    templateId.name,
                    templateId.language,
                    templateId.components
                );

                // Log message
                await MessageLog.create({
                    messageId: message.id,
                    userId: campaign.userId,
                    campaignId: campaign._id,
                    recipient: contact.phone,
                    messageType: 'template',
                    content: templateId.content,
                    status: 'sent'
                });

                // Update campaign stats
                campaign.sentCount += 1;
                await campaign.save();

                // Deduct credits
                await creditService.deductCredits(campaign.userId, 1, 'campaign', campaign._id);

            } catch (error) {
                // Log error
                await MessageLog.create({
                    userId: campaign.userId,
                    campaignId: campaign._id,
                    recipient: contact.phone,
                    messageType: 'template',
                    content: templateId.content,
                    status: 'failed',
                    error: error.message
                });

                // Update campaign stats
                campaign.failedCount += 1;
                await campaign.save();
            }
        }

        // Update campaign status
        campaign.status = 'completed';
        campaign.completedAt = new Date();
        await campaign.save();
    }

    // Get campaign statistics
    async getCampaignStats(userId, campaignId) {
        const campaign = await this.getCampaignById(userId, campaignId);

        const stats = await MessageLog.aggregate([
            { $match: { campaignId: campaign._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            total: campaign.totalRecipients,
            sent: campaign.sentCount,
            delivered: campaign.deliveredCount,
            failed: campaign.failedCount,
            statusBreakdown: stats.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {})
        };
    }

    // Get recipient status
    async getRecipientStatus(userId, campaignId, phone) {
        const campaign = await this.getCampaignById(userId, campaignId);

        const messageLog = await MessageLog.findOne({
            campaignId: campaign._id,
            recipient: phone
        });

        if (!messageLog) {
            throw new Error('Recipient not found in campaign');
        }

        return {
            status: messageLog.status,
            error: messageLog.error,
            timestamp: messageLog.createdAt
        };
    }
}

module.exports = new CampaignService();
