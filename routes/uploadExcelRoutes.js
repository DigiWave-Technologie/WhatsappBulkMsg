// routes/uploadExcelRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadExcelController = require("../controllers/uploadExcelController");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/",
  upload.single("uploadExcel"),
  uploadExcelController.uploadExcel
);

module.exports = router;
