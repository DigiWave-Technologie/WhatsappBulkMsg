const express = require("express");
const router = express.Router();
const personalCampaignController = require("../controllers/PersonalCampaignContoller");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/sendpersonalCampaign",
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
  personalCampaignController.createpersonalCampaign
);

router.get(
  "/personalCampaignScan",
  personalCampaignController.personalCampaignController
);
router.get("", personalCampaignController.getAllpersonalCampaigns);
router.delete("/InstanceDelete", personalCampaignController.logoutInstance);

router.get(
  "/getInstanceUserData",
  personalCampaignController.getInstanceUserData
);

module.exports = router;
