// utils/awsS3.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

// Create an S3 client using AWS SDK v3.
const s3Client = new S3Client({
  region: process.env.AWS_REGION, // e.g., "us-east-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file buffer to AWS S3.
 *
 * @param {Buffer} fileBuffer - The file data as a Buffer.
 * @param {string} fileName - The desired file name (and path) in S3.
 * @param {string} mimetype - The MIME type of the file.
 * @returns {Promise<Object>} - A promise that resolves with an object containing the file URL.
 */
const uploadFileToS3 = async (fileBuffer, fileName, mimetype) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimetype,
    // Removed the ACL property as the bucket does not support ACLs
  };

  try {
    // Upload the file using the PutObjectCommand.
    await s3Client.send(new PutObjectCommand(params));

    // Construct the file URL.
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    return { Location: fileUrl };
  } catch (err) {
    console.error("Error uploading to S3:", err);
    throw err;
  }
};

module.exports = { uploadFileToS3 };
