// services/uploadExcelService.js
const XLSX = require("xlsx");

/**
 * Processes the Excel file buffer and returns only the two columns specified by the user.
 * It will convert the media URL value to a string so that hyperlinks (or any other type)
 * will be returned as a string like "https://stock---media.s3.us-east-1.amazonaws.com/TRADING+COMPANY.png".
 *
 * @param {Buffer} fileBuffer - The file buffer from the uploaded Excel/CSV file.
 * @param {Object} body - The request body containing the columns to extract.
 * @returns {Object} - An object containing the filtered data and the used column identifiers.
 */
exports.processExcelFile = (fileBuffer, body) => {
  // Read the workbook from the file buffer
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  const whatsappColumn = body.whatsappColumn;
  const mediaUrlColumn = body.mediaUrlColumn;
  if (!whatsappColumn || !mediaUrlColumn) {
    throw new Error("Missing required column information.");
  }

  const colToIndex = (col) => col.toUpperCase().charCodeAt(0) - 65;
  const whatsappIndex = colToIndex(whatsappColumn);
  const mediaUrlIndex = colToIndex(mediaUrlColumn);

  const filteredData = jsonData.slice(1).map((row) => ({
    whatsapp: row[whatsappIndex],
    mediaUrl: String(row[mediaUrlIndex]).trim(),
  }));

  return {
    data: filteredData,
    whatsappColumn,
    mediaUrlColumn,
  };
};
