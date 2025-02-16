const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMessages, sendMessage, markAsRead } = require('../controllers/messagesController');

router.get('/', auth, getMessages);
router.post('/', auth, sendMessage);
router.put('/:id/read', auth, markAsRead);

module.exports = router; 