const pool = require('../db');

const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(`
            SELECT 
                m.*,
                sender.username as sender_name,
                receiver.username as receiver_name,
                l.title as listing_title
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            LEFT JOIN listings l ON m.listing_id = l.id
            WHERE m.sender_id = $1 OR m.receiver_id = $1
            ORDER BY m.timestamp DESC
        `, [userId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { receiver_id, listing_id, content } = req.body;
        const sender_id = req.user.id;

        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, listing_id, content)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [sender_id, receiver_id, listing_id, content]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.id;

        const result = await pool.query(
            `UPDATE messages 
             SET is_read = true 
             WHERE id = $1 AND receiver_id = $2
             RETURNING *`,
            [messageId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Message not found or unauthorized' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(`
            WITH LastMessages AS (
                SELECT DISTINCT ON (
                    CASE 
                        WHEN sender_id = $1 THEN receiver_id 
                        ELSE sender_id 
                    END
                )
                m.*,
                CASE 
                    WHEN sender_id = $1 THEN receiver_id 
                    ELSE sender_id 
                END as other_user_id,
                ROW_NUMBER() OVER (
                    PARTITION BY CASE 
                        WHEN sender_id = $1 THEN receiver_id 
                        ELSE sender_id 
                    END
                    ORDER BY timestamp DESC
                ) as rn
                FROM messages m
                WHERE sender_id = $1 OR receiver_id = $1
                ORDER BY other_user_id, timestamp DESC
            ),
            UnreadCounts AS (
                SELECT 
                    sender_id,
                    COUNT(*) as unread_count
                FROM messages
                WHERE receiver_id = $1 AND is_read = false
                GROUP BY sender_id
            )
            SELECT 
                lm.other_user_id as user_id,
                u.username,
                lm.*,
                COALESCE(uc.unread_count, 0) as unread_count
            FROM LastMessages lm
            JOIN users u ON lm.other_user_id = u.id
            LEFT JOIN UnreadCounts uc ON uc.sender_id = lm.other_user_id
            WHERE lm.rn = 1
            ORDER BY lm.timestamp DESC
        `, [userId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getConversationMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.userId;
        
        const result = await pool.query(`
            SELECT 
                m.*,
                sender.username as sender_name,
                receiver.username as receiver_name
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            WHERE (m.sender_id = $1 AND m.receiver_id = $2)
               OR (m.sender_id = $2 AND m.receiver_id = $1)
            ORDER BY m.timestamp ASC
        `, [userId, otherUserId]);
        
        // Mark messages as read
        await pool.query(`
            UPDATE messages
            SET is_read = true
            WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
        `, [userId, otherUserId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching conversation messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getMessages,
    sendMessage,
    markAsRead,
    getConversations,
    getConversationMessages
}; 