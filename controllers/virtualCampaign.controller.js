const waapi = require("@api/waapi");
const getUrlOfFile = require("../utils/helper");
require("dotenv").config();

const sendWhatsappBulkMsgs = async (req, res) => {
  try {
    let { phones, message } = req.body;
    let files = await getUrlOfFile(req.files); // Get file URLs if available

    if (!phones) {
      return res.status(400).send({ error: "Please Enter Phone Numbers" });
    }

    phones = Array.isArray(phones) ? phones : [phones];
    phones = phones.flatMap((phone) => phone.split(",")); // Ensure array format
    await waapi.auth(process.env.WHATSAPP_API);

    let results = [];

    for (const phone of phones) {
      try {
        const formattedPhone = String(phone).includes("@c.us")
          ? phone
          : `91${String(phone).replace(/^91/, "")}@c.us`;

        // **Send Message Only**
        if (message) {
          const response = await waapi.postInstancesIdClientActionSendMessage(
            {
              chatId: formattedPhone,
              message,
            },
            { id: process.env.WHATSAPP_INSTANCE_ID }
          );

          results.push({
            phone,
            status: "success",
            response_data: response.data,
          });
        }

        // **Send Media (One by One)**
        if (files.length) {
          for (const file of files) {
            const response = await waapi.postInstancesIdClientActionSendMedia(
              {
                chatId: formattedPhone,
                mediaUrl: file,
                mediaCaption: "", // Optional caption
                mediaName: "",
              },
              { id: process.env.WHATSAPP_INSTANCE_ID }
            );

            results.push({
              phone,
              status: "success",
              mediaUrl: file,
              response_data: response.data,
            });
          }
        }
      } catch (error) {
        results.push({ phone, status: "error", error: error.message });
      }
    }

    res.status(200).json({ success: true, status: "completed", results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  sendWhatsappBulkMsgs,
};
