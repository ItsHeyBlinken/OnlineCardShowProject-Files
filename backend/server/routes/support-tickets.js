const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/support-tickets');
    
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

// GET all support tickets with optional filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, search, user_id } = req.query;
    let query = `
      SELECT 
        t.id, 
        t.user_id, 
        u.username, 
        u.email, 
        t.subject, 
        t.message, 
        t.status, 
        t.priority, 
        t.category, 
        t.date_submitted, 
        t.last_updated,
        json_agg(
          json_build_object(
            'id', a.id,
            'name', a.filename,
            'url', concat('/uploads/support-tickets/', a.filepath),
            'size', a.filesize,
            'type', a.filetype
          )
        ) FILTER (WHERE a.id IS NOT NULL) AS attachments
      FROM support_tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN support_ticket_attachments a ON t.id = a.ticket_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add filters
    if (status) {
      query += ` AND t.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }
    
    if (priority) {
      query += ` AND t.priority = $${queryParams.length + 1}`;
      queryParams.push(priority);
    }
    
    if (user_id) {
      query += ` AND t.user_id = $${queryParams.length + 1}`;
      queryParams.push(user_id);
    }
    
    if (search) {
      query += ` AND (
        t.subject ILIKE $${queryParams.length + 1} OR
        t.message ILIKE $${queryParams.length + 1} OR
        u.username ILIKE $${queryParams.length + 1} OR
        u.email ILIKE $${queryParams.length + 1}
      )`;
      queryParams.push(`%${search}%`);
    }
    
    // Group by and order
    query += `
      GROUP BY t.id, u.username, u.email
      ORDER BY t.date_submitted DESC
    `;
    
    const { rows } = await db.query(query, queryParams);
    
    // Transform to match expected format
    const tickets = rows.map(ticket => ({
      id: ticket.id,
      userId: ticket.user_id,
      userName: ticket.username,
      userEmail: ticket.email,
      subject: ticket.subject,
      message: ticket.message,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      dateSubmitted: ticket.date_submitted,
      lastUpdated: ticket.last_updated,
      attachments: ticket.attachments || []
    }));
    
    res.json({ tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to retrieve support tickets' });
  }
});

// GET a single ticket by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        t.id, 
        t.user_id, 
        u.username, 
        u.email, 
        t.subject, 
        t.message, 
        t.status, 
        t.priority, 
        t.category, 
        t.date_submitted, 
        t.last_updated,
        json_agg(
          json_build_object(
            'id', a.id,
            'name', a.filename,
            'url', concat('/uploads/support-tickets/', a.filepath),
            'size', a.filesize,
            'type', a.filetype
          )
        ) FILTER (WHERE a.id IS NOT NULL) AS attachments
      FROM support_tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN support_ticket_attachments a ON t.id = a.ticket_id
      WHERE t.id = $1
      GROUP BY t.id, u.username, u.email
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }
    
    const ticket = {
      id: rows[0].id,
      userId: rows[0].user_id,
      userName: rows[0].username,
      userEmail: rows[0].email,
      subject: rows[0].subject,
      message: rows[0].message,
      category: rows[0].category,
      priority: rows[0].priority,
      status: rows[0].status,
      dateSubmitted: rows[0].date_submitted,
      lastUpdated: rows[0].last_updated,
      attachments: rows[0].attachments || []
    };
    
    res.json({ ticket });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({ error: 'Failed to retrieve support ticket' });
  }
});

// PATCH update ticket status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['Open', 'In Progress', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Open, In Progress, or Closed' });
    }
    
    // Check if ticket exists
    const checkQuery = 'SELECT id FROM support_tickets WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }
    
    // Update ticket status
    const updateQuery = `
      UPDATE support_tickets 
      SET status = $1, last_updated = NOW() 
      WHERE id = $2
    `;
    
    await db.query(updateQuery, [status, id]);
    
    res.json({ 
      message: 'Ticket status updated successfully',
      status
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// POST add reply to ticket
router.post('/:id/replies', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!message) {
      return res.status(400).json({ error: 'Reply message is required' });
    }
    
    // Check if ticket exists
    const checkQuery = 'SELECT id, status FROM support_tickets WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }
    
    const ticket = checkResult.rows[0];
    
    // Don't allow replies to closed tickets
    if (ticket.status === 'Closed') {
      return res.status(400).json({ error: 'Cannot reply to a closed ticket' });
    }
    
    // Add reply
    const replyQuery = `
      INSERT INTO support_ticket_replies (
        ticket_id, user_id, message, created_at
      )
      VALUES ($1, $2, $3, NOW())
      RETURNING id
    `;
    
    const replyResult = await db.query(replyQuery, [id, userId, message]);
    
    // Update ticket's last_updated timestamp
    const updateQuery = `
      UPDATE support_tickets 
      SET last_updated = NOW(), 
          status = CASE WHEN status = 'Open' THEN 'In Progress' ELSE status END
      WHERE id = $1
    `;
    
    await db.query(updateQuery, [id]);
    
    res.status(201).json({ 
      message: 'Reply added successfully',
      replyId: replyResult.rows[0].id
    });
  } catch (error) {
    console.error('Error adding reply to ticket:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// GET download attachment file
router.get('/:ticketId/attachments/:filename', authenticateToken, async (req, res) => {
  try {
    const { ticketId, filename } = req.params;
    
    // Find attachment in database
    const query = `
      SELECT filepath, filename, filetype 
      FROM support_ticket_attachments 
      WHERE ticket_id = $1 AND filepath = $2
    `;
    
    const { rows } = await db.query(query, [ticketId, filename]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    const attachment = rows[0];
    const filePath = path.join(
      __dirname, 
      '../uploads/support-tickets', 
      attachment.filepath
    );
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Attachment file not found' });
    }
    
    // Set content type and filename for download
    res.setHeader('Content-Type', attachment.filetype);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    
    // Stream the file
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

module.exports = router; 