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
const csv = require('csv-parse');
const fs = require('fs');
const path = require('path');
const { validatePhoneNumber } = require('../middleware/validateRequest');

class CampaignService {
    // Create a new campaign
    async createCampaign(userId, campaignData) {
        try {
            // Validate campaign type specific data
            this.validateCampaignData(campaignData);

            // If template is provided, validate and attach it
            if (campaignData.template) {
                const template = await Template.findById(campaignData.template);
                if (!template) {
                    throw new ApiError(404, 'Template not found');
                }
                // Validate template type matches campaign type
                if (template.type !== campaignData.type) {
                    throw new ApiError(400, 'Template type does not match campaign type');
                }
            }

            // Process recipients based on type
            if (campaignData.recipients.type === 'csv') {
                await this.processCSVRecipients(campaignData.recipients.csvFile);
            } else if (campaignData.recipients.type === 'numbers') {
                this.validatePhoneNumbers(campaignData.recipients.numbers);
            }

            const campaign = new Campaign({
                ...campaignData,
                createdBy: userId,
                stats: {
                    total: this.getTotalRecipients(campaignData.recipients),
                    sent: 0,
                    delivered: 0,
                    read: 0,
                    failed: 0,
                    responses: []
                }
            });

            await campaign.save();
            return campaign;
        } catch (error) {
            throw error;
        }
    }

    // Process CSV file for recipients
    async processCSVRecipients(csvFile) {
        try {
            const filePath = path.join(__dirname, '..', csvFile.url);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            
            const parser = csv.parse({
                columns: true,
                skip_empty_lines: true
            });

            const records = [];
            parser.on('readable', function() {
                let record;
                while (record = parser.read()) {
                    records.push(record);
                }
            });

            parser.on('error', function(err) {
                throw new ApiError(400, 'Error processing CSV file: ' + err.message);
            });

            parser.write(fileContent);
            parser.end();

            return records;
        } catch (error) {
            throw new ApiError(400, 'Error processing CSV file: ' + error.message);
        }
    }

    // Validate phone numbers
    validatePhoneNumbers(numbers) {
        const invalidNumbers = numbers.filter(number => !this.validatePhoneNumber(number));
        if (invalidNumbers.length > 0) {
            throw new ApiError(400, `Invalid phone numbers found: ${invalidNumbers.join(', ')}`);
        }
    }

    // Get total number of recipients
    getTotalRecipients(recipients) {
        switch (recipients.type) {
            case 'numbers':
                return recipients.numbers.length;
            case 'csv':
                return recipients.csvFile.totalRows;
            case 'group':
            case 'channel':
                return 1; // These will be expanded when sending
            default:
                return 0;
        }
    }

    // Validate campaign data based on type
    validateCampaignData(data) {
        switch (data.type) {
            case 'quick':
                if (!data.message.text) {
                    throw new ApiError(400, 'Quick campaign must have message text');
                }
                break;
            case 'csv':
                if (!data.message.variables || data.message.variables.length === 0) {
                    throw new ApiError(400, 'CSV campaign must have variables defined');
                }
                break;
            case 'button':
                if (!data.buttons || data.buttons.length === 0) {
                    throw new ApiError(400, 'Button campaign must have at least one button');
                }
                break;
            case 'poll':
                if (!data.poll.question || !data.poll.options || data.poll.options.length < 2) {
                    throw new ApiError(400, 'Poll campaign must have a question and at least 2 options');
                }
                break;
            case 'group':
            case 'channel':
                if (!data.recipients.groupId && !data.recipients.channelId) {
                    throw new ApiError(400, 'Group/Channel campaign must have a group or channel ID');
                }
                break;
        }
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

    // Schedule a campaign
    async scheduleCampaign(campaignId, scheduledTime) {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            throw new ApiError(404, 'Campaign not found');
        }

        campaign.scheduledTime = scheduledTime;
        campaign.status = 'scheduled';
        await campaign.save();

        return campaign;
    }

    // Rerun a campaign
    async rerunCampaign(campaignId) {
        const originalCampaign = await Campaign.findById(campaignId);
        if (!originalCampaign) {
            throw new ApiError(404, 'Campaign not found');
        }

        // Create a new campaign based on the original
        const newCampaign = new Campaign({
            ...originalCampaign.toObject(),
            _id: undefined, // Let MongoDB generate a new ID
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            scheduledTime: null,
            startedAt: null,
            completedAt: null,
            stats: {
                total: 0,
                sent: 0,
                delivered: 0,
                read: 0,
                failed: 0
            }
        });

        await newCampaign.save();
        return newCampaign;
    }
}

module.exports = new CampaignService();
