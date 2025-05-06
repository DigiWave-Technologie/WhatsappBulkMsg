// const fetch = require("node-fetch");

// const sendInteractiveMessage = async () => {
//   const response = await fetch("https://waapi.app/api/sendMessage", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: "Bearer YOUR_API_KEY", // Replace with your WaAPI API Key
//     },
//     body: JSON.stringify({
//       phone: "1234567890", // Receiver's WhatsApp number
//       type: "interactive", // Type of message
//       interactive: {
//         type: "button",
//         header: {
//           type: "image",
//           media: "https://your-image-url.com/image.jpg", // Image URL
//         },
//         body: "Hello! Choose an option below:", // Message text

//         action: {
//           buttons: [
//             {
//               type: "reply",
//               reply: {
//                 id: "call_us", //
//                 title: "📞 Call Us",
//               },
//             },
//             {
//               type: "url",
//               url: {
//                 link: "https://yourwebsite.com",
//                 title: "🌍 Visit Now",
//               },
//             },
//           ],
//         },
//       },
//     }),
//   });

//   const data = await response.json();
// };

// // Call the function
// sendInteractiveMessage();
