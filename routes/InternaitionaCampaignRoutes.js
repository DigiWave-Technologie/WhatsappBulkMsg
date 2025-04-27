const express = require("express");
const router = express.Router();
const InternaitionaCampaignController = require("../controllers/InternaitionaCampaignController");
const multer = require("multer");

// Use memoryStorage so files are kept in memory as Buffers.
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Accept fields including "userprofile", "excellsheet", and other media fields.
router.post(
  "/sendCampaign",
  upload.fields([
    { name: "userprofile", maxCount: 1 },
    { name: "excellsheet", maxCount: 1 }, // New field added here
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  InternaitionaCampaignController.createCampaign
);
router.get("", InternaitionaCampaignController.getAllInternationalCampaigns);
router.get(
  "/:campaignId",
  InternaitionaCampaignController.getInternationalCampaign
);

module.exports = router;
