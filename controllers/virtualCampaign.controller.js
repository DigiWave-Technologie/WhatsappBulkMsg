const waapi = require("@api/waapi");
const getUrlOfFile = require("../utils/helper");
const Template = require('../models/Template');
require("dotenv").config();

// Helper function to format phone numbers
const formatPhoneNumber = (phone) => {
  return String(phone).includes("@c.us")
    ? phone
    : `91${String(phone).replace(/^91/, "")}@c.us`;
};

// Helper function to handle API errors
const handleApiError = (error) => {
  console.error("WAAPI Error:", error);
  return {
    status: "error",
    error: error.message || "Unknown error occurred",
  };
};

// Helper function to process template variables
const processTemplateVariables = (template, variables) => {
  let message = template.message.text;
  if (variables) {
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, variables[key]);
    });
  }
  return message;
};

const sendWhatsappBulkMsgs = async (req, res) => {
  try {
    let { phones, message, campaignType, options, templateId, variables } = req.body;
    let files = await getUrlOfFile(req.files);

    if (!phones) {
      return res.status(400).send({ error: "Please Enter Phone Numbers" });
    }

    // If templateId is provided, fetch and use the template
    if (templateId) {
      const template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      message = processTemplateVariables(template, variables);
      
      // If template has media, add it to files
      if (template.images && template.images.length > 0) {
        files = [...files, ...template.images.map(img => img.url)];
      }
      if (template.video) {
        files.push(template.video.url);
      }
      if (template.pdf) {
        files.push(template.pdf.url);
      }
    }

    phones = Array.isArray(phones) ? phones : [phones];
    phones = phones.flatMap((phone) => phone.split(","));
    await waapi.auth(process.env.WHATSAPP_API);

    let results = [];

    for (const phone of phones) {
      try {
        const formattedPhone = formatPhoneNumber(phone);
        let response;

        switch (campaignType) {
          case "button":
            response = await sendButtonMessage(formattedPhone, message, options);
            break;
          case "poll":
            response = await sendPollMessage(formattedPhone, message, options);
            break;
          case "location":
            response = await sendLocationMessage(formattedPhone, options);
            break;
          case "contact":
            response = await sendContactMessage(formattedPhone, options);
            break;
          case "group":
            response = await handleGroupOperation(formattedPhone, options);
            break;
          case "channel":
            response = await handleChannelOperation(formattedPhone, options);
            break;
          default:
            response = await sendRegularMessage(formattedPhone, message, files);
        }

        results.push({
          phone,
          status: "success",
          response_data: response,
        });
      } catch (error) {
        results.push(handleApiError(error));
      }
    }

    res.status(200).json({ success: true, status: "completed", results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send regular message with media
const sendRegularMessage = async (formattedPhone, message, files) => {
  const responses = [];

  if (message) {
    const textResponse = await waapi.postInstancesIdClientActionSendMessage(
      {
        chatId: formattedPhone,
        message,
      },
      { id: process.env.WHATSAPP_INSTANCE_ID }
    );
    responses.push(textResponse.data);
  }

  if (files.length) {
    for (const file of files) {
      const mediaResponse = await waapi.postInstancesIdClientActionSendMedia(
        {
          chatId: formattedPhone,
          mediaUrl: file,
          mediaCaption: "",
          mediaName: "",
        },
        { id: process.env.WHATSAPP_INSTANCE_ID }
      );
      responses.push(mediaResponse.data);
    }
  }

  return responses;
};

// Send button message
const sendButtonMessage = async (formattedPhone, message, options) => {
  const response = await waapi.postInstancesIdClientActionSendMessage(
    {
      chatId: formattedPhone,
      message,
      buttons: options.buttons || [],
    },
    { id: process.env.WHATSAPP_INSTANCE_ID }
  );
  return response.data;
};

// Send poll message
const sendPollMessage = async (formattedPhone, message, options) => {
  const response = await waapi.postInstancesIdClientActionCreatePoll(
    {
      chatId: formattedPhone,
      question: message,
      options: options.pollOptions || [],
    },
    { id: process.env.WHATSAPP_INSTANCE_ID }
  );
  return response.data;
};

// Send location message
const sendLocationMessage = async (formattedPhone, options) => {
  const response = await waapi.postInstancesIdClientActionSendLocation(
    {
      chatId: formattedPhone,
      latitude: options.latitude,
      longitude: options.longitude,
      name: options.name || "",
      address: options.address || "",
    },
    { id: process.env.WHATSAPP_INSTANCE_ID }
  );
  return response.data;
};

// Send contact card
const sendContactMessage = async (formattedPhone, options) => {
  const response = await waapi.postInstancesIdClientActionSendVcard(
    {
      chatId: formattedPhone,
      vcard: options.vcard,
    },
    { id: process.env.WHATSAPP_INSTANCE_ID }
  );
  return response.data;
};

// Handle group operations
const handleGroupOperation = async (formattedPhone, options) => {
  let response;
  switch (options.operation) {
    case "create":
      response = await waapi.postInstancesIdClientActionCreateGroup(
        {
          name: options.groupName,
          participants: options.participants || [],
        },
        { id: process.env.WHATSAPP_INSTANCE_ID }
      );
      break;
    case "add":
      response = await waapi.postInstancesIdClientActionAddGroupParticipant(
        {
          groupId: formattedPhone,
          participantId: options.participantId,
        },
        { id: process.env.WHATSAPP_INSTANCE_ID }
      );
      break;
    case "remove":
      response = await waapi.postInstancesIdClientActionRemoveGroupParticipant(
        {
          groupId: formattedPhone,
          participantId: options.participantId,
        },
        { id: process.env.WHATSAPP_INSTANCE_ID }
      );
      break;
    default:
      throw new Error("Invalid group operation");
  }
  return response.data;
};

// Handle channel operations
const handleChannelOperation = async (formattedPhone, options) => {
  let response;
  switch (options.operation) {
    case "create":
      response = await waapi.postInstancesIdClientActionCreateChannel(
        {
          name: options.channelName,
          description: options.description || "",
        },
        { id: process.env.WHATSAPP_INSTANCE_ID }
      );
      break;
    case "subscribe":
      response = await waapi.postInstancesIdClientActionSubscribeToChannel(
        {
          channelId: formattedPhone,
        },
        { id: process.env.WHATSAPP_INSTANCE_ID }
      );
      break;
    case "unsubscribe":
      response = await waapi.postInstancesIdClientActionUnsubscribeFromChannel(
        {
          channelId: formattedPhone,
        },
        { id: process.env.WHATSAPP_INSTANCE_ID }
      );
      break;
    default:
      throw new Error("Invalid channel operation");
  }
  return response.data;
};

// Get message status
const getMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const response = await waapi.postInstancesIdClientActionGetMessageInfoById(
      {
        messageId,
      },
      { id: process.env.WHATSAPP_INSTANCE_ID }
    );
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const response = await waapi.postInstancesIdClientActionFetchMessages(
      {
        chatId: formatPhoneNumber(chatId),
        limit: req.query.limit || 50,
      },
      { id: process.env.WHATSAPP_INSTANCE_ID }
    );
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  sendWhatsappBulkMsgs,
  getMessageStatus,
  getChatHistory,
};
