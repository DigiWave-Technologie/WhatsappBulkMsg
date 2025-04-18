const express = require("express");
const router = express.Router();
const InternaitionapersonalCampaignController = require("../controllers/InternaitionapersonalCampaignController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/sendInternationalpersonalCampaign",
  upload.fields([
    { name: "userprofile", maxCount: 1 },
    { name: "excellsheet", maxCount: 1 },
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  InternaitionapersonalCampaignController.createpersonalCampaign
);

router.get(
  "/InternationalpersonalCampaignScan",
  InternaitionapersonalCampaignController.personalCampaignController
);
router.get("", InternaitionapersonalCampaignController.getAllpersonalCampaigns);
router.delete(
  "/InstanceDelete",
  InternaitionapersonalCampaignController.logoutInstance
);

router.get(
  "/getInstanceUserData",
  InternaitionapersonalCampaignController.getInstanceUserData
);

module.exports = router;
