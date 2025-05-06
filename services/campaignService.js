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
const Group = require('../models/Group'); // Represents contact groups
const { processSpintax } = require('../utils/helpers'); // <-- Import the new helper

class CampaignService {
    // Create a new campaign
    async createCampaign(userId, campaignData) {
        // Destructure new fields along with existing ones
        const { name, templateId, contactGroupId, scheduledAt, targetType = 'individual', targetId } = campaignData;

        // Validate template
        const template = await Template.findOne({ _id: templateId, userId });
        if (!template) {
            throw new Error('Template not found');
        }

        let totalRecipients = 0;
        let group = null;

        // Validate based on targetType
        if (targetType === 'individual') {
            if (!contactGroupId) {
                throw new Error('Contact group ID is required for individual campaigns.');
            }
            group = await Group.findOne({ _id: contactGroupId, userId });
            if (!group) {
                throw new Error('Contact group not found');
            }
            totalRecipients = group.contacts.length;
        } else if (targetType === 'group' || targetType === 'community' || targetType === 'channel') {
            if (!targetId) {
                throw new Error(`Target ID (Group/Community/Channel ID) is required for ${targetType} campaigns.`);
            }
            // For group/community/channel, we send one message to the target ID
            totalRecipients = 1;
            // Note: Validation of the targetId (e.g., checking if the group/channel exists via WhatsApp API)
            // might be necessary here or before starting the campaign.
        } else {
            throw new Error(`Invalid target type: ${targetType}`);
        }


        // Create campaign
        const campaign = new Campaign({
            name,
            userId,
            templateId,
            contactGroupId: targetType === 'individual' ? contactGroupId : null, // Store contactGroupId only if individual
            scheduledAt,
            totalRecipients,
            status: scheduledAt ? 'scheduled' : 'draft',
            targetType, // Store the target type
            targetId: targetType !== 'individual' ? targetId : null // Store targetId if not individual
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

    // Update campaign (Consider adding checks for paused/running status if needed)
    async updateCampaign(userId, campaignId, updateData) {
        const campaign = await Campaign.findOne({ _id: campaignId, userId });
        if (!campaign) {
            throw new ApiError(404, 'Campaign not found');
        }

        // Prevent updates on campaigns that are not in draft or scheduled state
        if (!['draft', 'scheduled'].includes(campaign.status)) {
            throw new ApiError(400, `Campaign cannot be updated in '${campaign.status}' status.`);
        }

        // Apply updates (add more fields as needed)
        if (updateData.name) campaign.name = updateData.name;
        if (updateData.templateId) campaign.templateId = updateData.templateId;
        if (updateData.contactGroupId) campaign.contactGroupId = updateData.contactGroupId;
        if (updateData.scheduledAt) campaign.scheduledAt = updateData.scheduledAt;
        if (updateData.targetType) campaign.targetType = updateData.targetType;
        if (updateData.targetId) campaign.targetId = updateData.targetId;

        // Recalculate recipients if group changes (for individual type)
        if (updateData.contactGroupId && campaign.targetType === 'individual') {
            const group = await Group.findById(updateData.contactGroupId);
            if (!group) throw new ApiError(404, 'Contact group not found');
            campaign.totalRecipients = group.contacts.length;
        } else if (updateData.targetType && updateData.targetType !== 'individual') {
            campaign.totalRecipients = 1;
        }

        await campaign.save();
        return campaign;
    }

    // Delete campaign
    async deleteCampaign(userId, campaignId) {
        const campaign = await Campaign.findOne({ _id: campaignId, userId });
        if (!campaign) {
            throw new ApiError(404, 'Campaign not found');
        }

        // Prevent deletion of running campaigns (optional, consider allowing cancellation first)
        if (['running', 'paused'].includes(campaign.status)) {
             throw new ApiError(400, `Cannot delete a campaign that is currently ${campaign.status}. Please cancel it first.`);
        }

        await Campaign.deleteOne({ _id: campaignId, userId });
        // Optionally: Delete associated message logs?
        // await MessageLog.deleteMany({ campaignId });
        return { message: 'Campaign deleted successfully' };
    }


    // Start campaign
    async startCampaign(userId, campaignId) {
        const campaign = await Campaign.findOne({ _id: campaignId, userId })
            .populate('templateId')
            // Conditionally populate contactGroupId only if targetType is 'individual'
            .populate(await Campaign.findOne({ _id: campaignId }).select('targetType').then(c => c?.targetType === 'individual' ? 'contactGroupId' : ''));


        if (!campaign) {
            throw new ApiError(404,'Campaign not found');
        }

        if (!['draft', 'scheduled'].includes(campaign.status)) {
            throw new ApiError(400, `Campaign cannot be started from '${campaign.status}' status.`);
        }

        if (campaign.status === 'scheduled' && campaign.scheduledAt && campaign.scheduledAt > new Date()) {
            throw new ApiError(400, 'Campaign is scheduled for a future date');
        }

        // Check credits
        const requiredCredits = campaign.totalRecipients; // Adjust if credit logic changes
        const hasCredits = await creditService.checkCredits(userId, requiredCredits);
        if (!hasCredits) {
            throw new ApiError(402,'Insufficient credits'); // 402 Payment Required is suitable
        }

        // Update campaign status
        campaign.status = 'running';
        campaign.startedAt = new Date();
        campaign.lastProcessedIndex = 0; // Ensure starting from the beginning
        campaign.pausedAt = null; // Clear pausedAt if it was somehow set
        await campaign.save();

        // Start sending messages asynchronously (don't await here)
        this.sendCampaignMessages(campaign._id); // Pass ID to avoid stale object issues

        return campaign;
    }

    // Pause campaign
    async pauseCampaign(userId, campaignId) {
        const campaign = await Campaign.findOne({ _id: campaignId, userId });
        if (!campaign) {
            throw new ApiError(404, 'Campaign not found');
        }
        if (campaign.status !== 'running') {
            throw new ApiError(400, `Campaign cannot be paused from '${campaign.status}' status.`);
        }

        campaign.status = 'paused';
        campaign.pausedAt = new Date();
        await campaign.save();
        // The sendCampaignMessages loop should detect the status change and stop
        return campaign;
    }

    // Resume campaign
    async resumeCampaign(userId, campaignId) {
        const campaign = await Campaign.findOne({ _id: campaignId, userId });
        if (!campaign) {
            throw new ApiError(404, 'Campaign not found');
        }
        if (campaign.status !== 'paused') {
            throw new ApiError(400, `Campaign cannot be resumed from '${campaign.status}' status.`);
        }

        // Optional: Re-check credits? Might be complex if some were already deducted.
        // For simplicity, assume credits were deducted and are sufficient.

        campaign.status = 'running';
        campaign.pausedAt = null;
        await campaign.save();

        // Re-trigger sending asynchronously, it will pick up from lastProcessedIndex
        this.sendCampaignMessages(campaign._id);

        return campaign;
    }

     // Cancel campaign
    async cancelCampaign(userId, campaignId) {
        const campaign = await Campaign.findOne({ _id: campaignId, userId });
        if (!campaign) {
            throw new ApiError(404, 'Campaign not found');
        }
        // Allow cancelling from running or paused states
        if (!['running', 'paused', 'scheduled'].includes(campaign.status)) {
            throw new ApiError(400, `Campaign cannot be cancelled from '${campaign.status}' status.`);
        }

        campaign.status = 'cancelled';
        campaign.completedAt = new Date(); // Mark cancellation time
        campaign.pausedAt = null; // Clear pausedAt if set
        await campaign.save();
        // The sendCampaignMessages loop should detect the status change and stop
        return campaign;
    }

    // Rerun campaign
    async rerunCampaign(userId, campaignId) {
        const campaign = await Campaign.findOne({ _id: campaignId, userId });
        if (!campaign) {
            throw new ApiError(404, 'Campaign not found');
        }
        // Allow rerunning from completed, failed, or cancelled states
        if (!['completed', 'failed', 'cancelled'].includes(campaign.status)) {
            throw new ApiError(400, `Campaign cannot be rerun from '${campaign.status}' status.`);
        }

        // Reset campaign state for rerun
        campaign.status = campaign.scheduledAt ? 'scheduled' : 'draft'; // Reset to original potential state
        campaign.sentCount = 0;
        campaign.deliveredCount = 0; // Assuming webhooks update these
        campaign.readCount = 0;      // Assuming webhooks update these
        campaign.failedCount = 0;
        campaign.lastProcessedIndex = 0;
        campaign.startedAt = null;
        campaign.completedAt = null;
        campaign.pausedAt = null;
        campaign.error = null;

        // Optionally: Delete previous message logs for this campaign?
        // await MessageLog.deleteMany({ campaignId });

        await campaign.save();
        // User needs to explicitly start the campaign again via startCampaign endpoint
        return campaign;
    }


    async sendCampaignMessages(campaignId) {
        // Fetch fresh campaign data inside the async process
        let campaign = await Campaign.findById(campaignId)
            .populate('templateId')
            .populate(await Campaign.findById(campaignId).select('targetType').then(c => c?.targetType === 'individual' ? 'contactGroupId' : ''));

        if (!campaign || campaign.status !== 'running') {
            console.log(`Campaign ${campaignId} not found or not in running state. Aborting send process.`);
            return;
        }

        const { userId, templateId, contactGroupId, targetType, targetId } = campaign;
        let { lastProcessedIndex = 0 } = campaign;

        if (!templateId) {
             console.error(`Campaign ${campaignId}: Template data missing.`);
             campaign.status = 'failed';
             campaign.error = 'Template data missing for campaign.';
             await campaign.save();
             return;
        }

        try {
            if (targetType === 'individual') {
                if (!contactGroupId || !contactGroupId.contacts) {
                    throw new Error('Contact group data missing or empty for individual campaign.');
                }

                const contacts = contactGroupId.contacts;
                for (let i = lastProcessedIndex; i < contacts.length; i++) {
                    const currentCampaignState = await Campaign.findById(campaignId).select('status');
                    if (!currentCampaignState || currentCampaignState.status !== 'running') {
                        console.log(`Campaign ${campaignId} status changed to ${currentCampaignState?.status}. Stopping message loop.`);
                        break;
                    }

                    const contact = contacts[i];
                    try {
                        // --- Process Spintax ---
                        // Assuming templateId.components is the array structure expected by whatsappService
                        // and contains text fields that might have Spintax.
                        // Adjust this based on your actual Template model structure.
                        const processedComponents = templateId.components.map(component => {
                            const newComponent = { ...component }; // Shallow copy
                            if (newComponent.type === 'BODY' && newComponent.text) {
                                newComponent.text = processSpintax(newComponent.text);
                            }
                            // Example for buttons (adjust based on your structure)
                            if (newComponent.type === 'BUTTONS' && newComponent.buttons) {
                                newComponent.buttons = newComponent.buttons.map(button => {
                                    if (button.type === 'QUICK_REPLY' && button.text) { // Or 'URL', 'PHONE_NUMBER' if they have text
                                        return { ...button, text: processSpintax(button.text) };
                                    }
                                    return button;
                                });
                            }
                            // Add similar processing for HEADER if needed
                            if (newComponent.type === 'HEADER' && newComponent.format === 'TEXT' && newComponent.text) {
                                newComponent.text = processSpintax(newComponent.text);
                            }
                            return newComponent;
                        });
                        // -----------------------

                        // Send message using template with processed components
                        const message = await whatsappService.sendTemplate(
                            contact.phone,
                            templateId.name,
                            templateId.language,
                            processedComponents // <-- Pass the processed components
                        );

                        // Log message
                        await MessageLog.create({
                            messageId: message.id,
                            userId: userId,
                            campaignId: campaignId,
                            recipient: contact.phone,
                            messageType: 'template',
                            // Log the *original* template content or a processed version? Decide based on needs.
                            // content: templateId.content, // Original
                            content: processedComponents.find(c => c.type === 'BODY')?.text || 'N/A', // Processed Body
                            status: 'sent'
                        });
                        campaign.sentCount = (campaign.sentCount || 0) + 1;

                        await creditService.deductCredits(userId, 1, 'campaign', campaignId);

                    } catch (error) {
                        console.error(`Failed to send to ${contact.phone} in campaign ${campaignId}:`, error);
                        await MessageLog.create({ /* ... log data ... */ status: 'failed', error: error.message });
                        campaign.failedCount = (campaign.failedCount || 0) + 1;
                    } finally {
                         campaign.lastProcessedIndex = i + 1;
                         await campaign.save();
                         // Optional delay
                    }
                } // End of for loop

            } else if (targetType === 'group' || targetType === 'community' || targetType === 'channel') {
                 const currentCampaignState = await Campaign.findById(campaignId).select('status');
                 if (!currentCampaignState || currentCampaignState.status !== 'running') {
                     console.log(`Campaign ${campaignId} status changed to ${currentCampaignState?.status}. Aborting group send.`);
                     return;
                 }

                 if (lastProcessedIndex === 0) {
                    try {
                        // --- Process Spintax for Group/Channel ---
                        const processedComponents = templateId.components.map(component => {
                             const newComponent = { ...component };
                             if (newComponent.type === 'BODY' && newComponent.text) {
                                 newComponent.text = processSpintax(newComponent.text);
                             }
                             if (newComponent.type === 'BUTTONS' && newComponent.buttons) {
                                 newComponent.buttons = newComponent.buttons.map(button => {
                                     if (button.type === 'QUICK_REPLY' && button.text) {
                                         return { ...button, text: processSpintax(button.text) };
                                     }
                                     return button;
                                 });
                             }
                             if (newComponent.type === 'HEADER' && newComponent.format === 'TEXT' && newComponent.text) {
                                 newComponent.text = processSpintax(newComponent.text);
                             }
                             return newComponent;
                         });
                        // ---------------------------------------

                        const message = await whatsappService.sendTemplate(
                            targetId,
                            templateId.name,
                            templateId.language,
                            processedComponents // <-- Pass processed components
                        );
                        await MessageLog.create({ /* ... log data ... */ status: 'sent', targetType: targetType });
                        campaign.sentCount = 1;
                        await creditService.deductCredits(userId, 1, 'campaign', campaignId);
                    } catch (error) {
                        console.error(`Failed to send to ${targetType} ${targetId} in campaign ${campaignId}:`, error);
                        await MessageLog.create({ /* ... log data ... */ status: 'failed', error: error.message, targetType: targetType });
                        campaign.failedCount = 1;
                    } finally {
                        campaign.lastProcessedIndex = 1;
                        await campaign.save();
                    }
                 }
            }

            // Final status update logic...
            const finalCampaignState = await Campaign.findById(campaignId).select('status lastProcessedIndex totalRecipients');
            if (finalCampaignState && finalCampaignState.status === 'running') {
                 if (finalCampaignState.lastProcessedIndex >= finalCampaignState.totalRecipients) {
                     finalCampaignState.status = 'completed';
                     finalCampaignState.completedAt = new Date();
                     await finalCampaignState.save();
                     console.log(`Campaign ${campaignId} completed successfully.`);
                 } else {
                      // This case should ideally not happen if the loop breaks correctly on pause/cancel
                      console.warn(`Campaign ${campaignId} finished send loop but not all recipients processed? Index: ${finalCampaignState.lastProcessedIndex}, Total: ${finalCampaignState.totalRecipients}`);
                 }
            }

        } catch (campaignError) {
             console.error(`Critical error processing campaign ${campaignId}:`, campaignError);
             // Fetch latest state before updating to avoid overwriting pause/cancel
             const errorCampaignState = await Campaign.findById(campaignId);
             if (errorCampaignState && errorCampaignState.status === 'running') {
                 errorCampaignState.status = 'failed';
                 errorCampaignState.error = campaignError.message || 'Unknown campaign processing error';
                 errorCampaignState.completedAt = new Date();
                 await errorCampaignState.save();
             }
        }
    }

    // Get campaign statistics
    async getCampaignStats(userId, campaignId) {
        const campaign = await this.getCampaignById(userId, campaignId);

        // Adjust aggregation if needed based on how group messages are logged
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
            sent: campaign.sentCount || 0, // Use stored counts
            delivered: campaign.deliveredCount || 0, // Assuming webhooks update this
            failed: campaign.failedCount || 0, // Use stored counts
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
