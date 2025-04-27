const { getQRCode } = require("../services/waQrcodeService");
const { uploadFileToS3 } = require("../utils/awsS3");
const { sendWhatsAppMessages } = require("../services/waMessageService");
const { sendMediaMessage } = require("../services/waMediaService");
const { insatnceforqr } = require("../utils/Randominsatnceforqr");
const { sendInteractiveMessage } = require("../services/waButtonService");
const { createPoll } = require("../services/waPollServices");
const { getInstanceById } = require("../services/waRetrieveuserdata");
const { DeleteInstance } = require("../services/waInstanceDelete");
const PersonalCampaignServices = require("../services/PersonalCampaignServices");

// Create the instance only once here.
const QRInstanceid = insatnceforqr();

// Helper delay function (in seconds)
const delay = (seconds) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

exports.personalCampaignController = async (req, res) => {
  try {
    const data = await getQRCode(QRInstanceid);
    res.json(data);
  } catch (error) {
    console.error("Error in personalCampaignController:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.createpersonalCampaign = async (req, res) => {
  try {
    // Extract fields from the request body
    const {
      campaignTitle,
      selectedGroup,
      whatsAppNumbers,
      userMessage,
      selectedTemplate,
      BetweenMessages, // Delay in seconds (can be null)
      image1Caption,
      image2Caption,
      image3Caption,
      image4Caption,
      pdfCaption,
      videoCaption,
      button1Text,
      button1Number,
      button2Text,
      button2Url,
      pollQuestion, // Poll question text
      pollOptions, // Poll options as a JSON string or array
    } = req.body;
    const files = req.files || {};

    // Sanitize the user message
    const sanitizedUserMessage = userMessage
      ? userMessage.replace(/<\/?[^>]+(>|$)/g, "")
      : "";

    // Process WhatsApp numbers
    let numbersArray = [];
    if (typeof whatsAppNumbers === "string") {
      numbersArray = whatsAppNumbers
        .split(/\r?\n/)
        .map((num) => num.trim())
        .filter((num) => num !== "");
    } else if (Array.isArray(whatsAppNumbers)) {
      numbersArray = whatsAppNumbers;
    }
    numbersArray = numbersArray.map((number) => {
      if (!number.startsWith("91")) number = `91${number}`;
      if (!number.endsWith("@c.us")) number = `${number}@c.us`;
      return number;
    });

    // Upload files to S3 if provided
    const excelSheetUrl = files.excellsheet
      ? (
          await uploadFileToS3(
            files.excellsheet[0].buffer,
            `campaigns/${Date.now()}-${files.excellsheet[0].originalname}`,
            files.excellsheet[0].mimetype
          )
        ).Location
      : null;
    const image1Url = files.image1
      ? (
          await uploadFileToS3(
            files.image1[0].buffer,
            `campaigns/${Date.now()}-${files.image1[0].originalname}`,
            files.image1[0].mimetype
          )
        ).Location
      : null;
    const image2Url = files.image2
      ? (
          await uploadFileToS3(
            files.image2[0].buffer,
            `campaigns/${Date.now()}-${files.image2[0].originalname}`,
            files.image2[0].mimetype
          )
        ).Location
      : null;
    const image3Url = files.image3
      ? (
          await uploadFileToS3(
            files.image3[0].buffer,
            `campaigns/${Date.now()}-${files.image3[0].originalname}`,
            files.image3[0].mimetype
          )
        ).Location
      : null;
    const image4Url = files.image4
      ? (
          await uploadFileToS3(
            files.image4[0].buffer,
            `campaigns/${Date.now()}-${files.image4[0].originalname}`,
            files.image4[0].mimetype
          )
        ).Location
      : null;
    const pdfUrl = files.pdf
      ? (
          await uploadFileToS3(
            files.pdf[0].buffer,
            `campaigns/${Date.now()}-${files.pdf[0].originalname}`,
            files.pdf[0].mimetype
          )
        ).Location
      : null;
    const videoUrl = files.video
      ? (
          await uploadFileToS3(
            files.video[0].buffer,
            `campaigns/${Date.now()}-${files.video[0].originalname}`,
            files.video[0].mimetype
          )
        ).Location
      : null;

    // Build campaign data object
    const campaignData = {
      campaignTitle,
      selectedGroup,
      whatsAppNumbers,
      userMessage: sanitizedUserMessage,
      selectedTemplate,
      BetweenMessages,
      button1Text,
      button1Number,
      button2Text,
      button2Url,
      image1: image1Url,
      image2: image2Url,
      image3: image3Url,
      image4: image4Url,
      pdf: pdfUrl,
      video: videoUrl,
      excellsheet: excelSheetUrl,
      image1Caption,
      image2Caption,
      image3Caption,
      image4Caption,
      pdfCaption,
      videoCaption,
      pollQuestion,
      pollOptions,
    };

    // Save campaign record in database
    const result = await PersonalCampaignServices.createpersonalCampaign(
      campaignData
    );

    // Determine if button data is provided (for interactive messages)
    const hasButtonData =
      Boolean(button1Text) ||
      Boolean(button1Number) ||
      Boolean(button2Text) ||
      Boolean(button2Url);

    // Build an array for image media data (if any)
    const imageMediaData = [];
    if (campaignData.image1) {
      imageMediaData.push({
        mediaUrl: campaignData.image1,
        mediaCaption: image1Caption,
        mediaName: "image1.png",
      });
    }
    if (campaignData.image2) {
      imageMediaData.push({
        mediaUrl: campaignData.image2,
        mediaCaption: image2Caption,
        mediaName: "image2.png",
      });
    }
    if (campaignData.image3) {
      imageMediaData.push({
        mediaUrl: campaignData.image3,
        mediaCaption: image3Caption,
        mediaName: "image3.png",
      });
    }
    if (campaignData.image4) {
      imageMediaData.push({
        mediaUrl: campaignData.image4,
        mediaCaption: image4Caption,
        mediaName: "image4.png",
      });
    }

    // Process each WhatsApp number sequentially
    for (const number of numbersArray) {
      // If a poll question is provided, send the poll message
      if (pollQuestion) {
        await createPoll([number], pollQuestion, pollOptions, QRInstanceid);
      }

      // Send either an interactive message or standard messages with media
      if (hasButtonData) {
        await sendInteractiveMessage(campaignData, [number], QRInstanceid);
      } else {
        const promises = [];
        promises.push(
          sendWhatsAppMessages(campaignData, [number], QRInstanceid)
        );
        if (campaignData.video) {
          promises.push(
            sendMediaMessage(
              {
                mediaUrl: campaignData.video,
                mediaCaption: videoCaption,
                mediaName: "video.mp4",
              },
              [number],
              QRInstanceid
            )
          );
        }
        if (campaignData.pdf) {
          promises.push(
            sendMediaMessage(
              {
                mediaUrl: campaignData.pdf,
                mediaCaption: pdfCaption,
                mediaName: "document.pdf",
              },
              [number],
              QRInstanceid
            )
          );
        }
        if (imageMediaData.length > 0) {
          const imagePromises = imageMediaData.map((mediaData) =>
            sendMediaMessage(mediaData, [number], QRInstanceid)
          );
          promises.push(Promise.all(imagePromises));
        }
        await Promise.all(promises);
      }

      // Wait the specified delay (BetweenMessages in seconds) before processing the next number
      if (
        BetweenMessages &&
        !isNaN(BetweenMessages) &&
        Number(BetweenMessages) > 0
      ) {
        await delay(Number(BetweenMessages));
      }
    }

    res.status(200).json({
      message: "Campaign saved successfully!",
      campaignId: result.insertId,
    });
  } catch (error) {
    console.error("Error in campaignController:", error);
    res.status(500).json({ error: "Failed to save campaign" });
  }
};

exports.getAllpersonalCampaigns = async (req, res) => {
  try {
    const campaigns = await PersonalCampaignServices.getAllpersonalCampaigns();
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getpersonalCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaignData = await PersonalCampaignServices.getCampaignById(
      campaignId
    );
    res.status(200).json(campaignData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getInstanceUserData = async (req, res) => {
  try {
    const data = await getInstanceById(QRInstanceid);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in getInstanceUserData:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.logoutInstance = async (req, res) => {
  try {
    const data = await DeleteInstance(QRInstanceid);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in logoutInstance:", error);
    res.status(500).json({ error: error.message });
  }
};
