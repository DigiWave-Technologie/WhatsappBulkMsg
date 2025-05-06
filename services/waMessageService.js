// services/waMessageService.js

const waapi = require("@api/waapi");

// Authenticate with waapi (this can also be done during application initialization)
const Auth = process.env.WAAPI_KEY;
waapi.auth(Auth);

// Function to send WhatsApp messages using campaignData and an array of chat IDs.
const sendWhatsAppMessages = async (
  campaignData,
  numbers,
  campaignInstance
) => {
  console.log("campaignInstance", campaignInstance);
  // Extract campaignTitle and userMessage from the campaignData object.
  const { campaignTitle, userMessage } = campaignData;

  // Build the message that will be sent.
  const message = userMessage;

  // Map over the numbers array and send a message to each number.
  const messagePromises = numbers.map((number) =>
    waapi
      .postInstancesIdClientActionSendMessage(
        {
          chatId: number,
          message,
          previewLink: true,
        },
        { id: campaignInstance } // Adjust the instance/sender ID as needed.
      )
      .then(({ data }) => {
        return data;
      })
      .catch((err) => {
        console.error(`Error sending message to ${number}:`, err);
        // Optionally handle errors here.
        return null;
      })
  );

  // Wait until all messages have been processed.
  return Promise.all(messagePromises);
};

module.exports = { sendWhatsAppMessages };
