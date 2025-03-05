const express = require('express');
const router = express.Router();
const { uploadImages, associateImagesWithListing } = require('../controllers/imageController');
const upload = require('../middleware/imageUpload');
const auth = require('../middleware/auth');

// Route for uploading multiple images
// Uses multer middleware to handle file uploads (max 5 files)
router.post('/upload', auth, upload.array('images', 5), uploadImages);

// Route for associating uploaded images with a listing after creation
router.post('/associate', auth, associateImagesWithListing);

module.exports = router; 