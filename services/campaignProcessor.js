const Campaign = require('../models/Campaign');
const whatsappService = require('./whatsappService');
const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');
const { RateLimiter } = require('limiter');
const creditService = require('./creditsService');
const Category = require('../models/Category');
const Credit = require('../models/Credit');
const { CreditTransaction } = require('../models/Credit');

class CampaignProcessor {
    constructor() {
        this.processingCampaigns = new Map();
        this.initializeRateLimiters();
    }

    initializeRateLimiters() {
        // Rate limiter for messages per minute
        this.messageLimiter = new RateLimiter({
            tokensPerInterval: 60,
            interval: 'minute'
        });

        // Rate limiter for messages per hour
        this.hourlyLimiter = new RateLimiter({
            tokensPerInterval: 1000,
            interval: 'hour'
        });

        // Rate limiter for messages per day
        this.dailyLimiter = new RateLimiter({
            tokensPerInterval: 5000,
            interval: 'day'
        });
    }

    async processCampaign(campaignId) {
        try {
            const campaign = await Campaign.findById(campaignId);

            if (!campaign) {
                throw new ApiError(404, 'Campaign not found');
            }

            // WhatsApp Official campaign type (add your type as needed)
            if (campaign.type === 'WHATSAPP_OFFICIAL') {
                await this.processWhatsAppOfficialCampaign(campaign);
                return { success: true, message: 'WhatsApp Official campaign processed successfully' };
            }

            // Find category that has this campaign
            const category = await Category.findOne({
                'campaignTypes.campaignIds': campaign._id,
                isActive: true
            });

            if (!category) {
                throw new ApiError(404, 'No active category found for this campaign');
            }

            // Calculate required credits
            const requiredCredits = await this.calculateRequiredCredits(campaign);

            // Check user's credit balance
            const userCredit = await Credit.findOne({
                userId: campaign.userId,
                categoryId: category._id
            });

            if (!userCredit || userCredit.credit < requiredCredits) {
                throw new ApiError(400, 'Insufficient credits for this campaign');
            }

            // Deduct credits
            userCredit.credit -= requiredCredits;
            await userCredit.save();

            // Create credit transaction
            await CreditTransaction.create({
                fromUserId: campaign.userId,
                toUserId: campaign.userId,
                categoryId: category._id,
                creditType: 'debit',
                credit: requiredCredits,
                campaignId: campaign._id,
                description: `Credits used for campaign: ${campaign.name}`
            });

            // Update campaign status
            campaign.status = 'running';
            await campaign.save();

            return {
                success: true,
                message: 'Campaign processed successfully',
                creditsUsed: requiredCredits
            };
        } catch (error) {
            throw error;
        }
    }

    async applyAntiBanMeasures(campaign) {
        // Randomize delay between messages
        campaign.settings.delayBetweenMessages = this.getRandomDelay(
            campaign.settings.minDelay || 1,
            campaign.settings.maxDelay || 5
        );

        // Add message variations if enabled
        if (campaign.settings.useMessageVariations) {
            campaign.message.text = this.getRandomMessageVariation(campaign.message.text);
        }

        await campaign.save();
    }

    getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getRandomMessageVariation(text) {
        // Implement message variation logic (e.g., using spintax)
        // This is a simple example - you might want to use a more sophisticated approach
        const variations = {
            'hello': ['hi', 'hey', 'greetings'],
            'thank you': ['thanks', 'appreciate it', 'much obliged'],
            // Add more variations
        };

        let result = text;
        for (const [key, values] of Object.entries(variations)) {
            if (text.toLowerCase().includes(key)) {
                const randomVariation = values[Math.floor(Math.random() * values.length)];
                result = text.replace(new RegExp(key, 'gi'), randomVariation);
            }
        }

        return result;
    }

    async checkRateLimits() {
        // Check all rate limits
        const canSend = await Promise.all([
            this.messageLimiter.tryRemoveTokens(1),
            this.hourlyLimiter.tryRemoveTokens(1),
            this.dailyLimiter.tryRemoveTokens(1)
        ]);

        return canSend.every(result => result);
    }

    async processQuickCampaign(campaign) {
        for (const recipient of campaign.recipients) {
            try {
                // Check rate limits
                const canSend = await this.checkRateLimits();
                if (!canSend) {
                    logger.warn('Rate limit reached, pausing campaign');
                    await campaign.pause();
                    return;
                }

                const response = await whatsappService.sendQuickMessage(
                    recipient.phoneNumber,
                    campaign.message.text,
                    campaign.media
                );

                await campaign.updateRecipientStatus(recipient.phoneNumber, 'sent', {
                    wamid: response.messages[0].id
                });

                // Add randomized delay between messages
                await this.delay(campaign.settings.delayBetweenMessages * 1000);
            } catch (error) {
                logger.error(`Error sending quick message to ${recipient.phoneNumber}:`, error);
                await this.handleMessageError(campaign, recipient, error);
            }
        }
    }

    async handleMessageError(campaign, recipient, error) {
        // Update recipient status
        await campaign.updateRecipientStatus(recipient.phoneNumber, 'failed', {
            errorMessage: error.message,
            errorCode: error.code
        });

        // Check if we should stop the campaign
        if (campaign.settings.stopOnError) {
            logger.error('Stopping campaign due to error');
            await campaign.pause();

            // Refund credits for remaining recipients
            const remainingRecipients = campaign.recipients.filter(r => r.status !== 'sent').length;
            if (remainingRecipients > 0) {
                const refundAmount = await this.calculateRequiredCredits({
                    ...campaign.toObject(),
                    recipients: campaign.recipients.filter(r => r.status !== 'sent')
                });

                await creditService.addCredit(campaign.userId, campaign.category._id, refundAmount);
                await creditService.logTransaction({
                    fromUserId: campaign.userId,
                    toUserId: campaign.userId,
                    categoryId: campaign.category._id,
                    creditType: 'credit',
                    credit: refundAmount,
                    campaignId: campaign._id,
                    description: 'Credit refund for remaining recipients',
                    metadata: { error: error.message }
                });
            }

            throw error;
        }

        // Implement retry logic
        if (recipient.retryCount < (campaign.settings.maxRetries || 3)) {
            recipient.retryCount++;
            await campaign.save();
            
            // Wait before retrying
            await this.delay(campaign.settings.retryDelay * 1000);
            
            // Retry sending the message
            await this.processQuickCampaign(campaign);
        }
    }

    async processButtonCampaign(campaign) {
        for (const recipient of campaign.recipients) {
            try {
                const response = await whatsappService.sendButtonMessage(
                    recipient.phoneNumber,
                    campaign.message.text,
                    campaign.buttons
                );

                await campaign.updateRecipientStatus(recipient.phoneNumber, 'sent', {
                    wamid: response.messages[0].id
                });

                await this.delay(campaign.settings.delayBetweenMessages * 1000);
            } catch (error) {
                logger.error(`Error sending button message to ${recipient.phoneNumber}:`, error);
                await campaign.updateRecipientStatus(recipient.phoneNumber, 'failed', {
                    errorMessage: error.message,
                    errorCode: error.code
                });
            }
        }
    }

    async processDPCampaign(campaign) {
        for (const recipient of campaign.recipients) {
            try {
                const response = await whatsappService.sendDPMessage(
                    recipient.phoneNumber,
                    campaign.media.url,
                    campaign.media.caption
                );

                await campaign.updateRecipientStatus(recipient.phoneNumber, 'sent', {
                    wamid: response.messages[0].id
                });

                await this.delay(campaign.settings.delayBetweenMessages * 1000);
            } catch (error) {
                logger.error(`Error sending DP message to ${recipient.phoneNumber}:`, error);
                await campaign.updateRecipientStatus(recipient.phoneNumber, 'failed', {
                    errorMessage: error.message,
                    errorCode: error.code
                });
            }
        }
    }

    async processPollCampaign(campaign) {
        for (const recipient of campaign.recipients) {
            try {
                const response = await whatsappService.sendPollMessage(
                    recipient.phoneNumber,
                    campaign.poll.question,
                    campaign.poll.options.map(opt => opt.text)
                );

                await campaign.updateRecipientStatus(recipient.phoneNumber, 'sent', {
                    wamid: response.messages[0].id
                });

                await this.delay(campaign.settings.delayBetweenMessages * 1000);
            } catch (error) {
                logger.error(`Error sending poll message to ${recipient.phoneNumber}:`, error);
                await campaign.updateRecipientStatus(recipient.phoneNumber, 'failed', {
                    errorMessage: error.message,
                    errorCode: error.code
                });
            }
        }
    }

    async processGroupCampaign(campaign) {
        try {
            const response = await whatsappService.sendGroupMessage(
                campaign.groupTargeting.groupId,
                {
                    type: 'text',
                    text: { body: campaign.message.text }
                }
            );

            await campaign.updateRecipientStatus(campaign.groupTargeting.groupId, 'sent', {
                wamid: response.messages[0].id
            });
        } catch (error) {
            logger.error(`Error sending group message:`, error);
            await campaign.updateRecipientStatus(campaign.groupTargeting.groupId, 'failed', {
                errorMessage: error.message,
                errorCode: error.code
            });
        }
    }

    // Add new campaign type processors
    async processListCampaign(campaign) {
        for (const recipient of campaign.recipients) {
            try {
                const canSend = await this.checkRateLimits();
                if (!canSend) {
                    await campaign.pause();
                    return;
                }

                const response = await whatsappService.sendListMessage(
                    recipient.phoneNumber,
                    campaign.message.text,
                    campaign.list.buttonText,
                    campaign.list.sections
                );

                await campaign.updateRecipientStatus(recipient.phoneNumber, 'sent', {
                    wamid: response.messages[0].id
                });

                await this.delay(campaign.settings.delayBetweenMessages * 1000);
            } catch (error) {
                await this.handleMessageError(campaign, recipient, error);
            }
        }
    }

    async processLocationCampaign(campaign) {
        for (const recipient of campaign.recipients) {
            try {
                const canSend = await this.checkRateLimits();
                if (!canSend) {
                    await campaign.pause();
                    return;
                }

                const response = await whatsappService.sendLocationMessage(
                    recipient.phoneNumber,
                    campaign.location.latitude,
                    campaign.location.longitude,
                    campaign.location.name,
                    campaign.location.address
                );

                await campaign.updateRecipientStatus(recipient.phoneNumber, 'sent', {
                    wamid: response.messages[0].id
                });

                await this.delay(campaign.settings.delayBetweenMessages * 1000);
            } catch (error) {
                await this.handleMessageError(campaign, recipient, error);
            }
        }
    }

    async processContactCampaign(campaign) {
        for (const recipient of campaign.recipients) {
            try {
                const canSend = await this.checkRateLimits();
                if (!canSend) {
                    await campaign.pause();
                    return;
                }

                const response = await whatsappService.sendContactMessage(
                    recipient.phoneNumber,
                    campaign.contacts
                );

                await campaign.updateRecipientStatus(recipient.phoneNumber, 'sent', {
                    wamid: response.messages[0].id
                });

                await this.delay(campaign.settings.delayBetweenMessages * 1000);
            } catch (error) {
                await this.handleMessageError(campaign, recipient, error);
            }
        }
    }

    async processOrderCampaign(campaign) {
        for (const recipient of campaign.recipients) {
            try {
                const canSend = await this.checkRateLimits();
                if (!canSend) {
                    await campaign.pause();
                    return;
                }

                const response = await whatsappService.sendOrderMessage(
                    recipient.phoneNumber,
                    campaign.order.orderId,
                    campaign.order.items,
                    campaign.order.total
                );

                await campaign.updateRecipientStatus(recipient.phoneNumber, 'sent', {
                    wamid: response.messages[0].id
                });

                await this.delay(campaign.settings.delayBetweenMessages * 1000);
            } catch (error) {
                await this.handleMessageError(campaign, recipient, error);
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async calculateRequiredCredits(campaign) {
        try {
            // Find category that has this campaign ID
            const category = await Category.findOne({
                'campaignTypes.campaignIds': campaign._id,
                isActive: true
            });

            if (!category) {
                throw new ApiError(404, 'No active category found for this campaign');
            }

            // Find campaign type configuration
            const campaignType = category.campaignTypes.find(ct => 
                ct.campaignIds.includes(campaign._id)
            );

            if (!campaignType) {
                throw new ApiError(400, 'Campaign not found in category');
            }

            // Calculate base credits
            let totalCredits = category.creditCost * campaignType.creditMultiplier;

            // Add media credits if present
            if (campaign.media && campaign.media.type !== 'none') {
                totalCredits += category.mediaCreditCost;
            }

            // Add interactive credits if present
            if (campaign.buttons && campaign.buttons.length > 0) {
                totalCredits += category.interactiveCreditCost;
            }

            return totalCredits;
        } catch (error) {
            throw error;
        }
    }

    async processWhatsAppOfficialCampaign(campaign) {
        try {
            const { recipients, batchSize = 1000, intervalTime = 5, schedule, metaTemplate } = campaign;
            const totalRecipients = recipients.length;
            let batches = [];
            
            console.log('Processing WhatsApp Official campaign:', {
                campaignId: campaign._id,
                templateName: metaTemplate?.name,
                recipientCount: totalRecipients
            });
            
            // Get WhatsApp configuration
            const WhatsAppConfig = require('../models/WhatsAppConfig');
            const config = await WhatsAppConfig.findOne({ 
                userId: campaign.userId, 
                is_active: true, 
                is_default: true 
            });
            
            if (!config) {
                throw new Error('WhatsApp configuration not found');
            }

            // Split recipients into batches
            for (let i = 0; i < totalRecipients; i += batchSize) {
                batches.push(recipients.slice(i, i + batchSize));
            }

            // Helper to send a batch using Meta API for template messages
            const sendMetaTemplateBatch = async (batch) => {
                const axios = require('axios');
                const results = [];
                
                for (const recipient of batch) {
                    try {
                        // Build template message payload
                        const templatePayload = {
                            messaging_product: 'whatsapp',
                            to: recipient.phoneNumber,
                            type: 'template',
                            template: {
                                name: metaTemplate.name,
                                language: {
                                    code: metaTemplate.language.code
                                }
                            }
                        };

                        // Add template components if variables exist
                        if (recipient.variables && Object.keys(recipient.variables).length > 0) {
                            const components = [];
                            
                            // Build body parameters
                            const bodyParams = [];
                            const sortedKeys = Object.keys(recipient.variables).sort((a, b) => parseInt(a) - parseInt(b));
                            
                            for (const key of sortedKeys) {
                                bodyParams.push({
                                    type: 'text',
                                    text: recipient.variables[key]
                                });
                            }
                            
                            if (bodyParams.length > 0) {
                                components.push({
                                    type: 'body',
                                    parameters: bodyParams
                                });
                            }
                            
                            templatePayload.template.components = components;
                        }

                        console.log(`Sending template message to ${recipient.phoneNumber}:`, templatePayload);

                        // Send message via Meta API
                        const response = await axios.post(
                            `https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`,
                            templatePayload,
                            {
                                headers: {
                                    'Authorization': `Bearer ${config.accessToken}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );

                        if (response.data && response.data.messages && response.data.messages[0]) {
                            results.push({
                                phoneNumber: recipient.phoneNumber,
                                success: true,
                                messageId: response.data.messages[0].id,
                                status: response.data.messages[0].message_status
                            });
                            
                            console.log(`✅ Message sent successfully to ${recipient.phoneNumber}:`, response.data.messages[0].id);
                            
                            // Update recipient status in campaign
                            const recipientIndex = campaign.recipients.findIndex(r => r.phoneNumber === recipient.phoneNumber);
                            if (recipientIndex !== -1) {
                                campaign.recipients[recipientIndex].status = 'sent';
                                campaign.recipients[recipientIndex].metadata = {
                                    wamid: response.data.messages[0].id,
                                    sentAt: new Date()
                                };
                                campaign.markModified(`recipients.${recipientIndex}`);
                            }
                        } else {
                            throw new Error('Invalid response from Meta API');
                        }
                    } catch (error) {
                        console.error(`❌ Failed to send message to ${recipient.phoneNumber}:`, error.response?.data || error.message);
                        results.push({
                            phoneNumber: recipient.phoneNumber,
                            success: false,
                            error: error.response?.data?.error?.message || error.message
                        });
                        
                        // Update recipient status in campaign
                        const recipientIndex = campaign.recipients.findIndex(r => r.phoneNumber === recipient.phoneNumber);
                        if (recipientIndex !== -1) {
                            campaign.recipients[recipientIndex].status = 'failed';
                            campaign.recipients[recipientIndex].metadata = {
                                errorMessage: error.response?.data?.error?.message || error.message
                            };
                            campaign.markModified(`recipients.${recipientIndex}`);
                        }
                    }
                }
                
                return results;
            };

            // If scheduled, wait until schedule.startAt
            const now = new Date();
            let startTime = schedule?.startAt ? new Date(schedule.startAt) : now;
            if (startTime > now) {
                console.log(`Campaign scheduled for ${startTime}, waiting...`);
                await new Promise(resolve => setTimeout(resolve, startTime - now));
            }

            // Update campaign status to running
            campaign.status = 'running';
            await campaign.save();

            // Send batches with interval
            let totalSent = 0;
            let totalFailed = 0;
            
            for (let b = 0; b < batches.length; b++) {
                console.log(`Processing batch ${b + 1}/${batches.length} with ${batches[b].length} recipients`);
                const results = await sendMetaTemplateBatch(batches[b]);
                
                // Count results
                results.forEach(result => {
                    if (result.success) {
                        totalSent++;
                    } else {
                        totalFailed++;
                    }
                });
                
                // Update campaign stats
                campaign.stats.sent = totalSent;
                campaign.stats.failed = totalFailed;
                await campaign.save();
                
                console.log(`Batch ${b + 1} completed: ${totalSent} sent, ${totalFailed} failed`);
                
                // Wait between batches (except for the last batch)
                if (b < batches.length - 1) {
                    console.log(`Waiting ${intervalTime} minutes before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, intervalTime * 60 * 1000));
                }
            }

            // Mark campaign as completed
            campaign.status = 'completed';
            campaign.stats.sent = totalSent;
            campaign.stats.failed = totalFailed;
            await campaign.save();
            
            console.log(`🎉 WhatsApp Official campaign completed: ${totalSent} sent, ${totalFailed} failed`);
            
        } catch (error) {
            console.error('❌ Error processing WhatsApp Official campaign:', error);
            campaign.status = 'failed';
            await campaign.save();
            throw error;
        }
    }

    // Keep the existing WAAPI functionality for other campaign types
    async processWAAPICampaign(campaign) {
        const { recipients, batchSize = 1000, intervalTime = 5, schedule, templateId, messageLimit } = campaign;
        const totalRecipients = recipients.length;
        let batches = [];
        
        // Split recipients into batches
        for (let i = 0; i < totalRecipients; i += batchSize) {
            batches.push(recipients.slice(i, i + batchSize));
        }
        
        // Helper to send a batch using WAAPI
        const sendBatch = async (batch) => {
            const numbers = batch.map(r => r.phoneNumber);
            // Use waMessageService to send messages via WAAPI
            const results = await require('./waMessageService').sendWhatsAppMessages(
                { campaignTitle: campaign.name, userMessage: campaign.message?.text },
                numbers,
                campaign.metaApiData?.phoneNumberId // or other instance ID as needed
            );
            
            // Update recipient statuses
            for (let i = 0; i < batch.length; i++) {
                const phone = batch[i].phoneNumber;
                if (results[i]) {
                    await campaign.updateRecipientStatus(phone, 'sent', { wamid: results[i].id });
                } else {
                    await campaign.updateRecipientStatus(phone, 'failed', { errorMessage: 'Send failed' });
                }
            }
        };
        
        // If scheduled, wait until schedule.startAt
        const now = new Date();
        let startTime = schedule?.startAt ? new Date(schedule.startAt) : now;
        if (startTime > now) {
            await new Promise(resolve => setTimeout(resolve, startTime - now));
        }
        
        // Send batches with interval
        for (let b = 0; b < batches.length; b++) {
            await sendBatch(batches[b]);
            if (b < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, intervalTime * 60 * 1000));
            }
        }
        
        campaign.status = 'completed';
        await campaign.save();
    }
}

module.exports = new CampaignProcessor(); 