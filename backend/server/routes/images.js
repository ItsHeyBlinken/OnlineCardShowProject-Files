const express = require('express');
const router = express.Router();
const { uploadImages, associateImagesWithListing } = require('../controllers/imageController');
const upload = require('../middleware/imageUpload');
const auth = require('../middleware/auth');
const pool = require('../db');
const multer = require('multer');
const { processImage, validateImage } = require('../utils/imageProcessor');
const { uploadFileToS3 } = require('../services/s3Service');
const { v4: uuidv4 } = require('uuid');
const { s3 } = require('../config/s3Config');

// Configure multer for profile image uploads using memory storage for S3
const profileImageStorage = multer.memoryStorage();

// Set up profile image upload middleware
const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
  },
  limits: {
    fileSize: 200 * 1024 // 200KB limit
  }
});

// Route for uploading multiple images
// Uses multer middleware to handle file uploads (max 5 files)
router.post('/upload', auth, upload.array('images', 5), uploadImages);

// Route for associating uploaded images with a listing after creation
router.post('/associate', auth, associateImagesWithListing);

// Route for uploading a profile image to S3
router.post('/profile', auth, uploadProfileImage.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Log the file info for debugging
    console.log('Profile image upload requested:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    // Validate the image
    const validation = validateImage(req.file);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.error 
      });
    }
    
    try {
      // Process the image (resize, optimize, convert format)
      const processedImage = await processImage(req.file);
      
      // Generate a unique user folder in S3
      const userId = req.user.id;
      const userFolder = `profiles/${userId}`;
      
      // Upload to S3
      const uploadResult = await uploadFileToS3(
        processedImage.buffer,
        processedImage.filename,
        processedImage.mimetype,
        userFolder,
        0
      );
      
      if (!uploadResult.success) {
        console.error('S3 upload failed:', uploadResult.error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to upload image to storage' 
        });
      }
      
      console.log('Image uploaded to S3:', uploadResult.url);
      
      // Now update the user's profile with the S3 image URL
      const updateResult = await pool.query(
        'UPDATE users SET image_url = $1 WHERE id = $2 RETURNING *',
        [uploadResult.url, userId]
      );
      
      if (updateResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedUser = updateResult.rows[0];
      console.log('User profile updated with new image URL:', uploadResult.url);
      
      res.json({ 
        success: true,
        message: 'Profile image uploaded successfully', 
        imageUrl: uploadResult.url,
        user: updatedUser
      });
    } catch (error) {
      console.error('Error processing/uploading image:', error);
      res.status(500).json({ 
        success: false, 
        message: `Image processing failed: ${error.message}` 
      });
    }
  } catch (error) {
    console.error('Error in profile image upload route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to proxy S3 images to avoid CORS issues
router.get('/proxy/:key(*)', async (req, res) => {
  try {
    const key = req.params.key;
    console.log('Image proxy request for key:', key);
    
    // Setup the S3 params
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    };
    
    // Get the object from S3
    const s3Object = await s3.getObject(params).promise();
    
    // Set the appropriate content type
    res.set('Content-Type', s3Object.ContentType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.set('Access-Control-Allow-Origin', '*'); // Allow from any origin
    
    // Send the image data
    res.send(s3Object.Body);
  } catch (error) {
    console.error('Error proxying image from S3:', error);
    console.log('Failed proxy request details:', {
      bucket: process.env.AWS_S3_BUCKET_NAME,
      requestedKey: req.params.key,
      s3Region: process.env.AWS_REGION || 'us-east-2'
    });
    
    // Return a default image or error response
    res.status(404).send('Image not found');
  }
});

module.exports = router; 