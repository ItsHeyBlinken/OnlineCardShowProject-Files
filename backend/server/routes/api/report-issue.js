const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../../db');
const auth = require('../../middleware/auth');

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/support-tickets');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${fileExt}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Validate file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 
      'application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, text, and Word documents are allowed'));
    }
  }
});

// POST /api/report-issue
router.post('/', auth.authenticateToken, upload.single('attachment'), async (req, res) => {
  try {
    const { subject, message, category, priority = 'Medium' } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }
    
    // Create ticket in the support_tickets table
    const ticketQuery = `
      INSERT INTO support_tickets (
        user_id, subject, message, category, priority, status, 
        date_submitted, last_updated
      )
      VALUES ($1, $2, $3, $4, $5, 'Open', NOW(), NOW())
      RETURNING id
    `;
    
    const ticketValues = [userId, subject, message, category, priority];
    const ticketResult = await db.query(ticketQuery, ticketValues);
    const ticketId = ticketResult.rows[0].id;
    
    // Save attachment if provided
    if (req.file) {
      const { filename, path: filepath, size, mimetype } = req.file;
      const filepathRelative = filepath.split('uploads/support-tickets/')[1] || filename;
      
      const attachmentQuery = `
        INSERT INTO support_ticket_attachments (
          ticket_id, filename, filepath, filesize, filetype
        )
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await db.query(attachmentQuery, [
        ticketId, 
        filename,
        filepathRelative,
        size,
        mimetype
      ]);
    }
    
    // Send email notification to admin (in a real app)
    // This would typically be handled by a separate email service
    
    res.status(201).json({ 
      success: true,
      message: 'Your issue has been reported successfully',
      ticketId
    });
  } catch (error) {
    console.error('Error reporting issue:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to report your issue. Please try again later.' 
    });
  }
});

module.exports = router; 