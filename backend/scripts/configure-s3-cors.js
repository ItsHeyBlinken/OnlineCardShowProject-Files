require('dotenv').config();
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-2' // Make sure this matches your bucket region
});

const s3 = new AWS.S3();

// Define CORS configuration
const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: [
        'http://localhost:3000',    // Development
        'https://your-production-domain.com'  // Replace with your production domain
      ],
      ExposeHeaders: ['ETag', 'x-amz-server-side-encryption'],
      MaxAgeSeconds: 3000
    }
  ]
};

// Apply CORS configuration to the bucket
async function configureCORS() {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      CORSConfiguration: corsConfiguration
    };

    console.log(`Updating CORS configuration for bucket: ${process.env.AWS_S3_BUCKET_NAME}`);
    const result = await s3.putBucketCors(params).promise();
    console.log('CORS configuration set successfully!');
    console.log('Result:', result);
    console.log('Your S3 bucket now allows requests from:');
    corsConfiguration.CORSRules[0].AllowedOrigins.forEach(origin => {
      console.log(`- ${origin}`);
    });
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
  }
}

configureCORS(); 