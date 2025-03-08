const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { getUser, createUser, updateUser, deleteUser, updateUserPreferences } = require('../controllers/userController');
const auth = require('../middleware/auth');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with user ID and timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${fileExt}`);
  }
});

// Set up file filter to only allow certain image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024 // 200KB limit
  }
});

// Route to get a user by ID
router.get('/:id', getUser);

// Route to create a new user
router.post('/', createUser);

// Route to update a user by ID
router.put('/:id', auth, updateUser);

// Route to delete a user by ID
router.delete('/:id', deleteUser);

// Route to update user preferences
router.put('/:id/preferences', auth, updateUserPreferences);

// Route to upload profile image
router.post('/profile-image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Get the relative path to the uploaded file
    const imagePath = `/uploads/profiles/${path.basename(req.file.path)}`;

    // Update the user's image_url in the database
    await pool.query(
      'UPDATE users SET image_url = $1 WHERE id = $2 RETURNING id, name, username, email, role, image_url',
      [imagePath, req.user.id]
    );

    res.json({ 
      message: 'Profile image uploaded successfully', 
      imageUrl: imagePath 
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
