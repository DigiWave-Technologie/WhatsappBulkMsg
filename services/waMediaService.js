// services/waMediaService.js

const waapi = require("@api/waapi");

// Authenticate with waapi (this can also be done during app initialization)
const Auth = process.env.WAAPI_KEY;
waapi.auth(Auth);
const sendMediaMessage = async (mediaData, numbers, campaignInstance) => {
  const { mediaUrl, mediaCaption, mediaName } = mediaData;

  const sendPromises = numbers.map((number) =>
    waapi
      .postInstancesIdClientActionSendMedia(
        {
          chatId: number,
          mediaUrl,
          mediaCaption,
          mediaName,
        },
        { id: campaignInstance } // Adjust the instance/sender ID as needed.
      )
      .then(({ data }) => {
        return data;
      })
      .catch((err) => {
        console.error(`Error sending media message to ${number}:`, err);
        return null;
      })
  );

  return Promise.all(sendPromises);
};

module.exports = { sendMediaMessage };
