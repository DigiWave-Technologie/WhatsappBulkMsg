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

class CampaignService {
    // Create a new campaign
    async createCampaign(campaignData, userId) {
        try {
            // Check user credits
            const userCredits = await creditService.getUserCredits(userId);
            const requiredCredits = this.calculateRequiredCredits(campaignData);
            
            if (userCredits < requiredCredits) {
                throw new Error('Insufficient credits');
            }

            // Create campaign based on type
            let campaign;
            switch (campaignData.type) {
                case 'personal':
                    campaign = new PersonalCampaign({
                        ...campaignData,
                        userId,
                        status: 'pending',
                        createdAt: new Date()
                    });
                    break;
                case 'international':
                    campaign = new InternationalCampaign({
                        ...campaignData,
                        userId,
                        status: 'pending',
                        createdAt: new Date()
                    });
                    break;
                case 'international-personal':
                    campaign = new InternationalPersonalCampaign({
                        ...campaignData,
                        userId,
                        status: 'pending',
                        createdAt: new Date()
                    });
                    break;
                default:
                    campaign = new Campaign({
                        ...campaignData,
                        userId,
                        status: 'pending',
                        createdAt: new Date()
                    });
            }

            await campaign.save();
            return campaign;
        } catch (error) {
            throw new Error(`Failed to create campaign: ${error.message}`);
        }
    }

    // Get campaigns with pagination and filters
    async getCampaigns(userId, filters = {}, page = 1, limit = 10) {
        const query = { createdBy: userId };

        // Apply filters
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.type) {
            query.type = filters.type;
        }
        if (filters.startDate) {
            query['schedule.startAt'] = { $gte: new Date(filters.startDate) };
        }
        if (filters.endDate) {
            query['schedule.endAt'] = { $lte: new Date(filters.endDate) };
        }

        const options = {
            page,
            limit,
            sort: { 'schedule.startAt': -1 },
            populate: [
                { path: 'template', select: 'name category' },
                { path: 'createdBy', select: 'username email' }
            ]
        };

        return await Campaign.paginate(query, options);
    }

    // Get campaign by ID
    async getCampaignById(campaignId, userId) {
        try {
            const campaign = await Campaign.findOne({ _id: campaignId, userId });
            if (!campaign) {
                const personalCampaign = await PersonalCampaign.findOne({ _id: campaignId, userId });
                if (!personalCampaign) {
                    const internationalCampaign = await InternationalCampaign.findOne({ _id: campaignId, userId });
                    if (!internationalCampaign) {
                        return await InternationalPersonalCampaign.findOne({ _id: campaignId, userId });
                    }
                    return internationalCampaign;
                }
                return personalCampaign;
            }
            return campaign;
        } catch (error) {
            throw new Error(`Failed to get campaign: ${error.message}`);
        }
    }

    // Update campaign
    async updateCampaign(campaignId, userId, updateData) {
        const campaign = await this.getCampaignById(campaignId, userId);

        // Check if campaign can be updated
        if (!['draft', 'scheduled'].includes(campaign.status)) {
            throw new ApiError(400, 'Cannot update campaign that is already running, completed, or cancelled');
        }

        // Update campaign data
        Object.assign(campaign, updateData);

        // Validate schedule
        campaign.validateSchedule();

        // Calculate required credits if recipients changed
        if (updateData.recipients) {
            const requiredCredits = this.calculateRequiredCredits(campaign);
            const hasCredits = await creditService.checkUserCredits(userId, requiredCredits);
            if (!hasCredits) {
                throw new ApiError(400, 'Insufficient credits');
            }
        }

        // Save and reschedule if necessary
        await campaign.save();
        if (campaign.status === 'scheduled') {
            await this.scheduleCampaign(campaign);
        }

        return campaign;
    }

    // Delete campaign
    async deleteCampaign(campaignId, userId) {
        try {
            const campaign = await this.getCampaignById(campaignId, userId);
            if (!campaign) {
                throw new Error('Campaign not found');
            }

            if (campaign.status === 'running') {
                throw new Error('Cannot delete a running campaign');
            }

            await campaign.remove();
            return { message: 'Campaign deleted successfully' };
        } catch (error) {
            throw new Error(`Failed to delete campaign: ${error.message}`);
        }
    }

    // Start campaign
    async startCampaign(campaignId, userId) {
        const campaign = await this.getCampaignById(campaignId, userId);

        if (campaign.status !== 'scheduled' && campaign.status !== 'draft') {
            throw new ApiError(400, 'Campaign cannot be started');
        }

        campaign.status = 'running';
        await campaign.save();

        // Start processing messages
        this.processCampaign(campaign);

        return campaign;
    }

    // Pause campaign
    async pauseCampaign(campaignId, userId) {
        const campaign = await this.getCampaignById(campaignId, userId);
        await campaign.pause();
        return campaign;
    }

    // Resume campaign
    async resumeCampaign(campaignId, userId) {
        const campaign = await this.getCampaignById(campaignId, userId);
        await campaign.resume();
        
        // Resume processing messages
        this.processCampaign(campaign);

        return campaign;
    }

    // Cancel campaign
    async cancelCampaign(campaignId, userId) {
        const campaign = await this.getCampaignById(campaignId, userId);
        await campaign.cancel();
        return campaign;
    }

    // Calculate required credits for campaign
    calculateRequiredCredits(campaign) {
        const baseCredits = calculateMessageCredits(
            campaign.template.content,
            campaign.media
        );
        return baseCredits * campaign.recipients.length;
    }

    // Schedule campaign for execution
    async scheduleCampaign(campaign) {
        // Implementation will depend on your job scheduling system
        // This is a placeholder for scheduling logic
        console.log(`Campaign ${campaign._id} scheduled for ${campaign.schedule.startAt}`);
    }

    // Process campaign messages
    async processCampaign(campaign) {
        try {
            const pendingRecipients = campaign.recipients.filter(r => r.status === 'pending');
            
            for (const recipient of pendingRecipients) {
                // Check if campaign is still running
                const updatedCampaign = await Campaign.findById(campaign._id);
                if (updatedCampaign.status !== 'running') {
                    break;
                }

                try {
                    // Process template variables
                    const message = await Template.replaceVariables(
                        campaign.template.content,
                        recipient.variables
                    );

                    // Send message
                    await whatsappService.sendMessage({
                        to: recipient.phoneNumber,
                        message,
                        media: campaign.media
                    });

                    // Update recipient status
                    await campaign.updateRecipientStatus(recipient.phoneNumber, 'sent');

                    // Deduct credits
                    await creditService.deductCredits(
                        campaign.createdBy,
                        calculateMessageCredits(message, campaign.media)
                    );

                    // Delay between messages
                    await new Promise(resolve => 
                        setTimeout(resolve, campaign.schedule.delayBetweenMessages)
                    );

                } catch (error) {
                    await campaign.updateRecipientStatus(
                        recipient.phoneNumber,
                        'failed',
                        { error: error.message }
                    );
                }
            }

            // Update campaign status if all messages are processed
            const completedCampaign = await Campaign.findById(campaign._id);
            if (!completedCampaign.recipients.some(r => r.status === 'pending')) {
                completedCampaign.status = 'completed';
                await completedCampaign.save();
            }

        } catch (error) {
            campaign.status = 'failed';
            await campaign.save();
            throw new ApiError(500, `Campaign processing failed: ${error.message}`);
        }
    }

    // Get campaign statistics
    async getCampaignStats(campaignId, userId) {
        const campaign = await this.getCampaignById(campaignId, userId);
        return campaign.stats;
    }

    // Get campaign delivery reports
    async getCampaignDeliveryReports(campaignId, userId, filters = {}) {
        const campaign = await this.getCampaignById(campaignId, userId);
        
        let recipients = campaign.recipients;

        // Apply filters
        if (filters.status) {
            recipients = recipients.filter(r => r.status === filters.status);
        }
        if (filters.startDate) {
            recipients = recipients.filter(r => r.sentAt >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            recipients = recipients.filter(r => r.sentAt <= new Date(filters.endDate));
        }

        return recipients;
    }
}

module.exports = new CampaignService();
