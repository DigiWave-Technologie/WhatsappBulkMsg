const Campaign = require('../models/Campaign');
const whatsappService = require('./whatsappService');
const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');
const { RateLimiter } = require('limiter');
const creditService = require('./creditsService');
const Category = require('../models/Category');

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
            const campaign = await Campaign.findById(campaignId).populate('category');
            if (!campaign) {
                throw new ApiError(404, 'Campaign not found');
            }

            if (this.processingCampaigns.has(campaignId)) {
                throw new ApiError(400, 'Campaign is already being processed');
            }

            // Check if campaign category exists and is active
            if (!campaign.category || !campaign.category.isActive) {
                throw new ApiError(400, 'Invalid or inactive campaign category');
            }

            // Check if campaign is within allowed time duration
            const now = new Date();
            const campaignStartTime = new Date(campaign.scheduledTime || campaign.createdAt);
            const timeDiff = now - campaignStartTime;
            
            if (timeDiff > campaign.category.maxDuration * 60 * 60 * 1000) { // Convert hours to milliseconds
                throw new ApiError(400, 'Campaign duration exceeds category limit');
            }

            // Check if user has sufficient credits
            const requiredCredits = await this.calculateRequiredCredits(campaign);
            const hasCredits = await creditService.checkUserCredits(campaign.userId, campaign.category._id, requiredCredits);
            
            if (!hasCredits) {
                throw new ApiError(402, 'Insufficient credits to run this campaign');
            }

            // Deduct credits before starting the campaign
            await creditService.debitCredits(campaign.userId, campaign.category._id, requiredCredits, campaign._id);

            this.processingCampaigns.set(campaignId, true);
            campaign.status = 'running';
            await campaign.save();

            // Apply anti-ban measures
            await this.applyAntiBanMeasures(campaign);

            // Process based on campaign type
            switch (campaign.type) {
                case 'quick':
                    await this.processQuickCampaign(campaign);
                    break;
                case 'button':
                    await this.processButtonCampaign(campaign);
                    break;
                case 'dp':
                    await this.processDPCampaign(campaign);
                    break;
                case 'poll':
                    await this.processPollCampaign(campaign);
                    break;
                case 'group':
                    await this.processGroupCampaign(campaign);
                    break;
                case 'list':
                    await this.processListCampaign(campaign);
                    break;
                case 'location':
                    await this.processLocationCampaign(campaign);
                    break;
                case 'contact':
                    await this.processContactCampaign(campaign);
                    break;
                case 'order':
                    await this.processOrderCampaign(campaign);
                    break;
                default:
                    throw new ApiError(400, 'Unsupported campaign type');
            }

            campaign.status = 'completed';
            await campaign.save();
        } catch (error) {
            logger.error(`Error processing campaign ${campaignId}:`, error);
            const campaign = await Campaign.findById(campaignId);
            if (campaign) {
                campaign.status = 'failed';
                await campaign.save();

                // Refund credits if campaign fails before completion
                if (error.message !== 'Insufficient credits to run this campaign') {
                    await creditService.addCredit(campaign.userId, campaign.category._id, requiredCredits);
                    await creditService.logTransaction({
                        fromUserId: campaign.userId,
                        toUserId: campaign.userId,
                        categoryId: campaign.category._id,
                        creditType: 'credit',
                        credit: requiredCredits,
                        campaignId: campaign._id,
                        description: 'Credit refund due to campaign failure',
                        metadata: { error: error.message }
                    });
                }
            }
            throw error;
        } finally {
            this.processingCampaigns.delete(campaignId);
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
        if (!campaign.category) {
            throw new ApiError(400, 'Campaign category not found');
        }

        // Base credits from category
        let totalCredits = campaign.category.creditCost;

        // Multiply by number of recipients
        totalCredits *= campaign.recipients.length;

        // Add additional credits for media if present
        if (campaign.media) {
            totalCredits += campaign.recipients.length * (campaign.category.mediaCreditCost || 1);
        }

        // Add credits for interactive elements if applicable
        if (['button', 'list', 'poll'].includes(campaign.type)) {
            totalCredits += campaign.recipients.length * (campaign.category.interactiveCreditCost || 1);
        }

        return Math.ceil(totalCredits); // Round up to nearest whole credit
    }
}

module.exports = new CampaignProcessor(); 