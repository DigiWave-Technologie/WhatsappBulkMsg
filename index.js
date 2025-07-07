// server.js (or your main Express file)
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const https = require("https");
const fs = require("fs");
require("dotenv").config();
const connectDB = require("./config/mongodb");
const { errorHandler } = require("./middleware/errorHandler");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// Add body parsers before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to log request body for POST requests to /api/campaigns
app.use('/api/campaigns', (req, res, next) => {
  if (req.method === 'POST') {
    console.log('Campaign POST request body:', req.body);
  }
  next();
});

// Middleware to log request body for all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} request body:`, req.body);
  next();
});

// Import existing routes
const authRoutes = require("./routes/authRoutes");
const CreditsRoutes = require("./routes/creditsRoutes");
const msgTemplateRoutes = require("./routes/msgTemplateRoutes");
const msgGroupRoutes = require("./routes/msgGroupRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const InternaitionaCampaignRoutes = require("./routes/InternaitionaCampaignRoutes");
const PersonalCampaignRoutes = require("./routes/PersonalCampaignRoutes");
const InternaitionapersonalCampaignRoutes = require("./routes/InternaitionapersonalCampaignRoutes");
const uploadExcelRoutes = require("./routes/uploadExcelRoutes");
const credittypeRouter = require("./routes/credittypeRouter");
const templateRoutes = require('./routes/templateRoutes');
const apiRoutes = require('./routes/apiRoutes');
const reportRoutes = require('./routes/reportRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const whatsappWebhook = require('./webhooks/whatsapp');
const whatsappRoutes = require('./routes/whatsapp');

// Import new routes
const whatsAppOfficialTemplateRoutes = require('./routes/whatsAppOfficialTemplateRoutes');
const whatsAppOfficialCategoryRoutes = require('./routes/whatsAppOfficialCategoryRoutes');
const userTriggerRoutes = require('./routes/userTriggerRoutes');

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

// Load SSL certificate and key
const sslOptions = {
  key: fs.readFileSync("/etc/letsencrypt/live/wahbulk.com/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/wahbulk.com/fullchain.pem"),
};

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB connected successfully');

    // Mount routes after MongoDB connection
    app.use("/api/auth", authRoutes);
    app.use("/api/credits", CreditsRoutes);
    app.use("/api/credittype", credittypeRouter);
    app.use("/api/msggroup", msgGroupRoutes);
    app.use("/api/msgtemplate", msgTemplateRoutes);
    app.use("/api/msgtemplate", msgTemplateRoutes);
    app.use("/api/msggroup", msgGroupRoutes);
    app.use("/api/campaigns", campaignRoutes);
    app.use("/api/Internationalcampaign", InternaitionaCampaignRoutes);
    app.use("/api/PersonalCampaign", PersonalCampaignRoutes);
    app.use("/api/InternationalPersonalCampaign", InternaitionapersonalCampaignRoutes);
    app.use("/api/uploadExcel", uploadExcelRoutes);
    app.use('/api/templates', templateRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api', apiRoutes);
    app.use('/webhook/whatsapp', whatsappWebhook);
    app.use('/api/whatsapp', whatsappRoutes);

    // Mount new routes
    app.use('/api/whatsapp-official/templates', whatsAppOfficialTemplateRoutes);
    app.use('/api/whatsapp-official/categories', whatsAppOfficialCategoryRoutes);
    app.use('/api/user-triggers', userTriggerRoutes);

    // Error handling middleware
    app.use(errorHandler);

    // Start server
  //   app.listen(PORT, () => {
  //     console.log(`Server running on http://localhost:${PORT}`);
  //   });
  // } catch (error) {
  //   console.error("Failed to start server:", error);
  //   process.exit(1);
  // }
  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`Server running on https://wahbulk.com:${PORT}`);
  });
} catch (error) {
  console.error("Failed to start server:", error);
  process.exit(1);
}
};

startServer();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

module.exports = app;