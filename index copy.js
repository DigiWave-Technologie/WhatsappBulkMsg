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
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import existing routes
const authRoutes = require("./routes/authRoutes");
const CreditsRoutes = require("./routes/creditsRoutes");
const msgTemplateRoutes = require("./routes/msgTemplateRoutes");
const msgGroupRoutes = require("./routes/msgGroupRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const InternaitionaCampaignRoutes = require("./routes/InternaitionaCampaignRoutes");
const PersonalCampaignRoutes = require("./routes/PersonalCampaignRoutes");
const InternaitionapersonalCampaignRoutes = require("./routes/InternaitionapersonalCampaignRoutes");
// Import the new Excel upload route
const uploadExcelRoutes = require("./routes/uploadExcelRoutes");
const credittypeRouter = require("./routes/credittypeRouter");
const templateRoutes = require('./routes/templateRoutes');
const apiRoutes = require('./routes/apiRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectDB().catch(err => console.error('MongoDB connection error:', err));

// Apply authentication middleware to protected routes
app.use("/api/auth", authRoutes);
app.use("/api/transfer", CreditsRoutes);
app.use("/api/credittype", credittypeRouter);
app.use("/api/msggroup", msgGroupRoutes);
app.use("/api/msgtemplate", msgTemplateRoutes);
app.use("/api/campaign", campaignRoutes);
app.use("/api/Internationalcampaign", InternaitionaCampaignRoutes);
app.use("/api/PersonalCampaign", PersonalCampaignRoutes);
app.use(
  "/api/InternationalPersonalCampaign",
  InternaitionapersonalCampaignRoutes
);
app.use("/api/uploadExcel", uploadExcelRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/v1', apiRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use(errorHandler);

// Function to find an available port
const findAvailablePort = async (startPort) => {
  const net = require('net');
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
  });
};

// Start server with port handling
const startServer = async () => {
  try {
    const availablePort = await findAvailablePort(PORT);
    app.listen(availablePort, () => {
      console.log(`Server running on http://localhost:${availablePort}`);
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
    // Close server & exit process
    process.exit(1);
});

module.exports = app;
