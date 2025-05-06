const waapi = require("@api/waapi");

const Auth = process.env.WAAPI_KEY;
waapi.auth(Auth);
const createPoll = async (
  whatsAppNumbers,
  pollQuestion,
  pollOptions,
  QRInstanceid
) => {
  try {
    // Ensure pollOptions is a valid array of strings
    let optionsArray;
    if (typeof pollOptions === "string") {
      try {
        optionsArray = JSON.parse(pollOptions);
        // If parsing didn't yield an array, fallback to splitting by comma.
        if (!Array.isArray(optionsArray)) {
          optionsArray = pollOptions.split(",").map((item) => item.trim());
        }
      } catch (error) {
        console.error("Error parsing pollOptions as JSON:", error);
        optionsArray = pollOptions.split(",").map((item) => item.trim());
      }
    } else if (Array.isArray(pollOptions)) {
      optionsArray = pollOptions;
    } else {
      throw new Error(
        "pollOptions must be a valid JSON array string or an array."
      );
    }

    // Validate that the options count is between 2 and 12.
    if (
      !Array.isArray(optionsArray) ||
      optionsArray.length < 2 ||
      optionsArray.length > 12
    ) {
      throw new Error(
        "Poll options must be an array of strings with between 2 and 12 options."
      );
    }

    // For each WhatsApp number, send one poll with all the options together.
    for (const chatId of whatsAppNumbers) {
      const payload = {
        options: optionsArray, // send the complete array of options
        chatId: chatId, // WhatsApp number (e.g., "919876543210@c.us")
        caption: pollQuestion, // Poll question as caption
        multipleAnswers: true,
      };

      const response = await waapi.postInstancesIdClientActionCreatePoll(
        payload,
        { id: QRInstanceid } // Instance ID – verify this is correct
      );
    }

    return { message: "Poll sent successfully!" };
  } catch (error) {
    console.error("Error sending poll:", error);
    throw new Error("Failed to send poll");
  }
};

module.exports = { createPoll };
