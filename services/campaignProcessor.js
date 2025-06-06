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
}

module.exports = new CampaignProcessor(); 