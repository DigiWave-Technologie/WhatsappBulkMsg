// controllers/uploadExcelController.js
const { processExcelFile } = require("../services/uploadExcelService");

exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const fileBuffer = req.file.buffer;
    const result = processExcelFile(fileBuffer, req.body);

    return res.json({
      message: "File processed successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Error processing Excel file:", error);
    return res.status(500).json({ error: "Failed to process file" });
  }
};
