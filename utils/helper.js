const uploadFile = require("./s3Service");

const getUrlOfFile = async (files) => {
    try {
        // Upload all files and collect URLs
        const uploadedFiles = await Promise.all(files.map(file => uploadFile(file)));

        return uploadedFiles; // Array of file URLs
    } catch (error) {
        console.error("Error uploading files:", error);
        throw error;
    }
};

module.exports = getUrlOfFile;
