const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMessages, sendMessage, markAsRead, getConversations, getConversationMessages, deleteConversation } = require('../controllers/messagesController');

router.get('/', auth, getMessages);
router.post('/', auth, sendMessage);
router.put('/:id/read', auth, markAsRead);
router.get('/conversations', auth, getConversations);
router.get('/conversation/:userId', auth, getConversationMessages);
router.delete('/conversation', auth, deleteConversation);

module.exports = router; 