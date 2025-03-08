const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

// Set S3 to use path-style endpoints instead of virtual-hosted style
// This can help with some CORS issues
const s3Options = {
    params: { Bucket: process.env.AWS_S3_BUCKET_NAME },
    s3ForcePathStyle: true, // Force path style URLs
    signatureVersion: 'v4' // Use signature v4 for better security
};

// Create S3 service object
const s3 = new AWS.S3(s3Options);

/**
 * Helper function to add CORS headers to S3 URLs
 * This is used when generating URLs for frontend use
 */
const getPublicUrl = (key) => {
    // Generate a pre-signed URL that expires in 1 hour (3600 seconds)
    const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Expires: 3600 // 1 hour in seconds
    });
    
    console.log('Generated pre-signed URL:', signedUrl);
    return signedUrl;
};

module.exports = {
    s3,
    getPublicUrl
}; 