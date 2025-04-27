const express = require("express");
const router = express.Router();
const axios = require("axios");

// Configuration
const config = {
  companyPhone: "8866589213", // Indian number without country code
  countryCode: "91", // India's country code
  websiteURL: "https://yourwebsite.com",
  apiEndpoint: "https://api.your-whatsapp-provider.com/send",
};

const securityTokens = {
  33: "DwD366eXyAeZLPSJYKL4RlvpSjsBxs6L3k7Z9r4E90f770a0",
};

// WhatsApp Webhook Handler
router.post(
  "/webhooks/whatsapp/DwD366eXyAeZLPSJYKL4RlvpSjsBxs6L3k7Z9r4E90f770a0n",
  async (req, res) => {
    try {
      const { security_token } = req.params;
      const { instanceId, event, data } = req.body;

      if (!security_token || !instanceId || !event || !data) {
        return res.status(400).send("Invalid request");
      }

      if (securityTokens[instanceId] !== security_token) {
        return res.status(401).send("Authentication failed");
      }

      if (event === "interactive") {
        const interactive = data.interactive;
        const sender = data.from.replace("@c.us", "");

        if (interactive.type === "button_reply") {
          const buttonId = interactive.button_reply.id;

          if (buttonId === "call_btn") {
            await sendDirectLink(instanceId, sender, "call");
          } else if (buttonId === "visit_btn") {
            await sendDirectLink(instanceId, sender, "website");
          }
        }
      }

      res.sendStatus(200);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal server error");
    }
  }
);

// Send direct redirection links
async function sendDirectLink(instanceId, to, type) {
  let message;

  if (type === "call") {
    const fullNumber = `${config.countryCode}${config.companyPhone}`;
    message = {
      instanceId,
      to,
      type: "text",
      text: `Call us directly: https://wa.me/${fullNumber}\nOr use: tel:+${fullNumber}`,
    };
  } else if (type === "website") {
    message = {
      instanceId,
      to,
      type: "text",
      text: `Visit our website: ${config.websiteURL}`,
    };
  }

  await axios.post(config.apiEndpoint, message, {
    headers: {
      Authorization: `Bearer ${securityTokens[instanceId]}`,
      "Content-Type": "application/json",
    },
  });
}

module.exports = router;
