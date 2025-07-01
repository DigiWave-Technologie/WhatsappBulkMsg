const express = require('express');
const router = express.Router();
const axios = require('axios');

// WhatsApp Cloud API configuration
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;



// Webhook verification
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Webhook verification attempt:', { mode, token, challenge });

    if (mode && token) {
        if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
            console.log('Webhook verified successfully');
            res.status(200).send(challenge);
        } else {
            console.log('Webhook verification failed');
            res.sendStatus(403);
        }
    } else {
        console.log('Missing mode or token');
        res.sendStatus(400);
    }
});

// Webhook for receiving messages
router.post('/', async (req, res) => {
    try {
        const { body } = req;

        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
                const from = body.entry[0].changes[0].value.messages[0].from;
                const msg_body = body.entry[0].changes[0].value.messages[0].text.body;

                console.log('Received message:', {
                    from,
                    body: msg_body,
                    phone_number_id
                });

                // Send response back to WhatsApp
                const WHATSAPP_API_URL = `https://graph.facebook.com/v22.0`; // This will be dynamic later
                await sendWhatsAppMessage(from, `Received your message: ${msg_body}`, phone_number_id, WHATSAPP_API_URL);
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.sendStatus(500);
    }
});

// Function to send WhatsApp message
async function sendWhatsAppMessage(to, message, phoneNumberId, apiUrl) {
    try {
        const response = await axios({
            method: 'POST',
            url: `${apiUrl}/${phoneNumberId}/messages`,
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            data: {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: message }
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
}

module.exports = router;