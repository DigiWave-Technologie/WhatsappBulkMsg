const Campaign = require('../models/Campaign');
const MessageLog = require('../models/MessageLog');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/ApiError');
const rateLimit = require('express-rate-limit');

class WebhookHandler {
    constructor() {
        this.statusHandlers = new Map();
        this.initializeStatusHandlers();
    }

    initializeStatusHandlers() {
        this.statusHandlers.set('sent', this.handleSentStatus.bind(this));
        this.statusHandlers.set('delivered', this.handleDeliveredStatus.bind(this));
        this.statusHandlers.set('read', this.handleReadStatus.bind(this));
        this.statusHandlers.set('failed', this.handleFailedStatus.bind(this));
        this.statusHandlers.set('deleted', this.handleDeletedStatus.bind(this));
    }

    // Create rate limiter for webhook endpoints
    createRateLimiter() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later'
        });
    }

    // Process incoming webhook
    async processWebhook(webhookData) {
        try {
            const { object, entry } = webhookData;

            if (object !== 'whatsapp_business_account') {
                throw new ApiError(400, 'Invalid webhook object');
            }

            for (const entryData of entry) {
                for (const change of entryData.changes) {
                    if (change.field === 'messages') {
                        await this.processMessageChange(change.value);
                    }
                }
            }

            return { success: true };
        } catch (error) {
            logger.error('Error processing webhook:', error);
            throw error;
        }
    }

    // Process message changes
    async processMessageChange(value) {
        const { messages, statuses } = value;

        if (messages) {
            await this.processIncomingMessages(messages);
        }

        if (statuses) {
            await this.processMessageStatuses(statuses);
        }
    }

    // Process incoming messages
    async processIncomingMessages(messages) {
        for (const message of messages) {
            try {
                const { from, type, ...messageData } = message;
                
                // Log incoming message
                await MessageLog.create({
                    recipient: from,
                    messageType: type,
                    content: messageData,
                    status: 'received',
                    direction: 'incoming'
                });

                // Handle different message types
                switch (type) {
                    case 'text':
                        await this.handleTextMessage(from, messageData);
                        break;
                    case 'interactive':
                        await this.handleInteractiveMessage(from, messageData);
                        break;
                    case 'location':
                        await this.handleLocationMessage(from, messageData);
                        break;
                    case 'contacts':
                        await this.handleContactsMessage(from, messageData);
                        break;
                    case 'reaction':
                        await this.handleReactionMessage(from, messageData);
                        break;
                    default:
                        logger.info(`Unhandled message type: ${type}`);
                }
            } catch (error) {
                logger.error('Error processing incoming message:', error);
            }
        }
    }

    // Process message statuses
    async processMessageStatuses(statuses) {
        for (const status of statuses) {
            try {
                const { id, status: messageStatus, timestamp } = status;
                
                // Find campaign and update status
                const campaign = await Campaign.findOne({
                    'recipients.metadata.wamid': id
                });

                if (campaign) {
                    const recipient = campaign.recipients.find(
                        r => r.metadata.wamid === id
                    );

                    if (recipient) {
                        const handler = this.statusHandlers.get(messageStatus);
                        if (handler) {
                            await handler(campaign, recipient, status);
                        }
                    }
                }

                // Update message log
                await MessageLog.findOneAndUpdate(
                    { messageId: id },
                    { 
                        status: messageStatus,
                        statusTimestamp: new Date(timestamp * 1000)
                    }
                );
            } catch (error) {
                logger.error('Error processing message status:', error);
            }
        }
    }

    // Status handlers
    async handleSentStatus(campaign, recipient, status) {
        recipient.status = 'sent';
        recipient.metadata.sentAt = new Date(status.timestamp * 1000);
        campaign.stats.sent++;
        await campaign.save();
    }

    async handleDeliveredStatus(campaign, recipient, status) {
        recipient.status = 'delivered';
        recipient.metadata.deliveredAt = new Date(status.timestamp * 1000);
        campaign.stats.delivered++;
        await campaign.save();
    }

    async handleReadStatus(campaign, recipient, status) {
        recipient.status = 'read';
        recipient.metadata.readAt = new Date(status.timestamp * 1000);
        campaign.stats.read++;
        await campaign.save();
    }

    async handleFailedStatus(campaign, recipient, status) {
        recipient.status = 'failed';
        recipient.metadata.errorMessage = status.errors?.[0]?.message;
        recipient.metadata.errorCode = status.errors?.[0]?.code;
        campaign.stats.failed++;
        await campaign.save();
    }

    async handleDeletedStatus(campaign, recipient, status) {
        recipient.status = 'deleted';
        recipient.metadata.deletedAt = new Date(status.timestamp * 1000);
        await campaign.save();
    }

    // Message type handlers
    async handleTextMessage(from, messageData) {
        // Implement text message handling logic
        logger.info(`Received text message from ${from}: ${messageData.text.body}`);
    }

    async handleInteractiveMessage(from, messageData) {
        // Implement interactive message handling logic
        logger.info(`Received interactive message from ${from}: ${JSON.stringify(messageData)}`);
    }

    async handleLocationMessage(from, messageData) {
        // Implement location message handling logic
        logger.info(`Received location message from ${from}: ${JSON.stringify(messageData)}`);
    }

    async handleContactsMessage(from, messageData) {
        // Implement contacts message handling logic
        logger.info(`Received contacts message from ${from}: ${JSON.stringify(messageData)}`);
    }

    async handleReactionMessage(from, messageData) {
        // Implement reaction message handling logic
        logger.info(`Received reaction message from ${from}: ${JSON.stringify(messageData)}`);
    }
}

module.exports = new WebhookHandler(); 