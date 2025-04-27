// const axios = require("axios");

// const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
// const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
// const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
// const INITIAL_SHORT_LIVED_TOKEN = process.env.INITIAL_SHORT_LIVED_TOKEN;

// async function createButtonTemplate() {
//   try {
//     const longLivedTokenResponse = await axios.get(
//       `https://graph.facebook.com/v21.0/oauth/access_token`,
//       {
//         params: {
//           grant_type: "fb_exchange_token",
//           client_id: FACEBOOK_APP_ID,
//           client_secret: FACEBOOK_APP_SECRET,
//           fb_exchange_token: INITIAL_SHORT_LIVED_TOKEN,
//         },
//       }
//     );
//     const accessToken = longLivedTokenResponse.data.access_token;
//     console.log("Successfully obtained access token");

//     const templateName = "Button_template" + Math.floor(Date.now() / 1000);
//     console.log(`Creating new template with name: ${templateName}`);

//     const templateData = {
//       name: templateName,
//       category: "MARKETING",
//       language: "en_US",
//       components: [
//         {
//           type: "HEADER",
//           format: "TEXT",
//           text: "Special Offer!",
//         },
//         {
//           type: "BODY",
//           text: "Hello {{1}}, we have a special {{2}}% discount waiting for you at our store!",
//           example: {
//             body_text: [["Customer", "15"]],
//           },
//         },
//         {
//           type: "FOOTER",
//           text: "Tap a button below to connect with us",
//         },
//         {
//           type: "BUTTONS",
//           buttons: [
//             {
//               type: "PHONE_NUMBER",
//               text: "Call Now",
//               phone_number: "+911234567890",
//             },
//             {
//               type: "URL",
//               text: "Visit Store",
//               url: "https://www.example.com",
//             },
//           ],
//         },
//       ],
//     };

//     const templateResponse = await axios.post(
//       `https://graph.facebook.com/v21.0/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
//       templateData,
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("Template created successfully!");
//     console.log("Template ID:", templateResponse.data.id);
//     console.log("Template Name:", templateName);
//     console.log(
//       "Please use this template name in your send-dynamic-template.js file"
//     );
//     return templateResponse.data;
//   } catch (error) {
//     console.error("Error creating template:");
//     if (error.response) {
//       console.error(
//         "Error details:",
//         JSON.stringify(error.response.data, null, 2)
//       );
//     } else {
//       console.error(error.message);
//     }
//     throw error;
//   }
// }

// // createButtonTemplate()
// //   .then((result) => {
// //     console.log("Template creation complete");
// //     console.log("Result:", result);
// //   })
// //   .catch((error) => {
// //     console.error("Process failed:", error.message);
// //   });
