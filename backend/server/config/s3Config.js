const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

// Configure S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

/**
 * Helper function to add CORS headers to S3 URLs
 * This is used when generating URLs for frontend use
 */
const getPublicUrl = async (key) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key
    });
    
    // Generate a pre-signed URL that expires in 1 hour (3600 seconds)
    try {
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        console.log('Generated pre-signed URL:', signedUrl);
        return signedUrl;
    } catch (error) {
        console.error('Error generating pre-signed URL:', error);
        throw error;
    }
};

module.exports = {
    s3Client,
    getPublicUrl
}; 