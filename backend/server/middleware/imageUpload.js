const multer = require('multer');
const { validateImage } = require('../utils/imageProcessor');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function to validate uploaded images
const fileFilter = (req, file, cb) => {
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!validMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPEG, PNG, or WebP files are allowed.'), false);
    }
    
    // Validate file size at the controller level since multer's fileFilter
    // doesn't have access to the file size before it's uploaded to memory
    cb(null, true);
};

// Configure multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 250 * 1024, // 250KB limit (slightly higher than our 200KB requirement to allow validation in controller)
        files: 5 // Maximum 5 images
    }
});

module.exports = upload; 