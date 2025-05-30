// server.js (or your main Express file)
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const connectDB = require("./config/mongodb");
const { errorHandler } = require("./middleware/errorHandler");
const fs = require("fs");
const path = require("path");
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000; // Changed to 3000 to match your request

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

// Import existing routes
const authRoutes = require("./routes/authRoutes");
const creditsRoutes = require("./routes/creditsRoutes");
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
const campaignCreditRoutes = require('./routes/campaignCreditRoutes');
const campaignTypeCostRoutes = require('./routes/campaignTypeCostRoutes');

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB connected successfully');

    // Mount routes after MongoDB connection
    app.use("/api/auth", authRoutes);
    app.use("/api/credits", creditsRoutes);
    app.use("/api/templates", msgTemplateRoutes);
    app.use("/api/groups", msgGroupRoutes);
    app.use("/api/campaigns", campaignRoutes);
    app.use("/api/international-campaigns", InternaitionaCampaignRoutes);
    app.use("/api/personal-campaigns", PersonalCampaignRoutes);
    app.use("/api/international-personal-campaigns", InternaitionapersonalCampaignRoutes);
    app.use("/api/upload", uploadExcelRoutes);
    app.use("/api/credit-types", credittypeRouter);
    app.use("/api/templates", templateRoutes);
    app.use("/api/v1", apiRoutes);
    app.use("/api/reports", reportRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/whatsapp", whatsappRoutes);
    app.use("/api/campaign-credits", campaignCreditRoutes);
    app.use("/api/campaign-costs", campaignTypeCostRoutes);

    // Error handling middleware
    app.use(errorHandler);

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Available routes:');
      console.log('POST /api/auth/createUser - Create a new user');
      console.log('POST /api/auth/login - User login');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

module.exports = app;
