const InternaitionaCampaignService = require("../services/InternaitionaCampaignService");
const { uploadFileToS3 } = require("../utils/awsS3");
const { sendWhatsAppMessages } = require("../services/waMessageService");
const { sendMediaMessage } = require("../services/waMediaService");
const { setWaUserProfile } = require("../services/waUserprofileService");
const { getRandomInstance } = require("../utils/RandomInstance");

exports.createCampaign = async (req, res) => {
  try {
    const {
      campaignTitle,
      selectedGroup,
      whatsAppNumbers,
      userMessage,
      selectedTemplate,
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
      countryCode, // Dynamic country code from the frontend
    } = req.body;
    const files = req.files || {};

    // Upload the user profile file (if provided) and get its S3 URL.
    // Upload files (user profile, excel sheet, images, pdf, video) to S3 (if provided)
    const userprofileUrl = files.userprofile
      ? (
          await uploadFileToS3(
            files.userprofile[0].buffer,
            `campaigns/${Date.now()}-${files.userprofile[0].originalname}`,
            files.userprofile[0].mimetype
          )
        ).Location
      : null;

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

    // Remove HTML tags from userMessage
    const sanitizedUserMessage = userMessage
      ? userMessage.replace(/<\/?[^>]+(>|$)/g, "")
      : "";

    // Build campaign data object including all fields.
    const campaignData = {
      campaignTitle,
      selectedGroup,
      whatsAppNumbers,
      userMessage: sanitizedUserMessage,
      selectedTemplate,
      userprofile: userprofileUrl,
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
      countryCode, // Dynamic country code from the frontend
    };

    // Save the campaign record in the database.
    const result = await InternaitionaCampaignService.createCampaign(
      campaignData
    );

    // Process whatsAppNumbers into an array of formatted chat IDs.
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
      // Ensure the country code is present at the start
      if (!number.startsWith(countryCode)) {
        number = `${countryCode}${number}`;
      }
      // Append "@c.us" if it's not already there
      if (!number.endsWith("@c.us")) {
        number = `${number}@c.us`;
      }
      return number;
    });

    // For each WhatsApp number, generate a random instance.
    const numbersWithInstances = numbersArray.map((number) => ({
      number,
      instance: getRandomInstance(),
    }));

    // Prepare media data for images if provided.
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
    const hasButtonData =
      Boolean(campaignData.button1Text) || Boolean(campaignData.button2Text);

    // For each number, call the appropriate downstream service based on button data.
    await Promise.all(
      numbersWithInstances.map(async ({ number, instance }) => {
        if (hasButtonData) {
          await sendInteractiveMessage(campaignData, [number], instance);
        } else {
          // Otherwise, use the regular messaging workflow.
          const promises = [];
          if (campaignData.image1) {
            promises.push(
              setWaUserProfile(campaignData.image1, [number], instance)
            );
          }
          promises.push(sendWhatsAppMessages(campaignData, [number], instance));

          if (campaignData.video) {
            promises.push(
              sendMediaMessage(
                {
                  mediaUrl: campaignData.video,
                  mediaCaption: videoCaption,
                  mediaName: "video.mp4",
                },
                [number],
                instance
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
                instance
              )
            );
          }
          if (imageMediaData.length > 0) {
            const imagePromises = imageMediaData.map((mediaData) =>
              sendMediaMessage(mediaData, [number], instance)
            );
            promises.push(Promise.all(imagePromises));
          }
          await Promise.all(promises);
        }
      })
    );

    // Return the response.
    res.status(200).json({
      message: "Campaign saved successfully!",
      campaignId: result.insertId,
      // Optionally, you could also return details of the unique instances if needed.
    });
  } catch (error) {
    console.error("Error in campaignController:", error);
    res.status(500).json({ error: "Failed to save campaign" });
  }
};

exports.getAllInternationalCampaigns = async (req, res) => {
  try {
    const campaigns =
      await InternaitionaCampaignService.getAllInternationalCampaigns();
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getInternationalCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaignData =
      await InternaitionaCampaignService.getInternationalCampaignById(
        campaignId
      );
    res.status(200).json(campaignData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
