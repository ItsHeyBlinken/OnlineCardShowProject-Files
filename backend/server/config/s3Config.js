const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

// Create S3 service object
const s3 = new AWS.S3({
    params: { Bucket: process.env.AWS_S3_BUCKET_NAME }
});

module.exports = s3; 