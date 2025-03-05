const s3 = require('../config/s3Config');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload a file to AWS S3
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} originalFilename - The original filename
 * @param {string} fileType - The mimetype of the file
 * @param {string} listingId - The listing ID to organize files in S3
 * @param {number} index - The index of the image (for multiple images)
 * @returns {Promise<object>} - Object containing S3 upload result
 */
const uploadFileToS3 = async (fileBuffer, originalFilename, fileType, listingId, index = 0) => {
    // Generate a unique filename to avoid collisions
    const uniqueId = uuidv4();
    const fileExtension = originalFilename.split('.').pop();
    const key = `listings/${listingId}/image${index}_${uniqueId}.${fileExtension}`;
    
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: fileType
        // ACL parameter removed - Use bucket policies instead for public access
        // This avoids the "AccessControlListNotSupported" error when bucket has ACLs disabled
    };
    
    try {
        const uploadResult = await s3.upload(params).promise();
        
        return {
            success: true,
            url: uploadResult.Location,
            key: uploadResult.Key
        };
    } catch (error) {
        console.error('Error uploading to S3:', error);
        return {
            success: false,
            error: `Failed to upload to S3: ${error.message}`
        };
    }
};

/**
 * Delete a file from AWS S3
 * @param {string} key - The S3 object key to delete
 * @returns {Promise<object>} - Object containing S3 delete result
 */
const deleteFileFromS3 = async (key) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key
    };
    
    try {
        await s3.deleteObject(params).promise();
        return {
            success: true
        };
    } catch (error) {
        console.error('Error deleting from S3:', error);
        return {
            success: false,
            error: `Failed to delete from S3: ${error.message}`
        };
    }
};

module.exports = {
    uploadFileToS3,
    deleteFileFromS3
}; 