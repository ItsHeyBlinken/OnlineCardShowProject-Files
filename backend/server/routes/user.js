const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get user subscription details
router.get('/subscription', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // First check the subscriptions table
    const subscriptionResult = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1',
      [req.user.id]
    );

    if (subscriptionResult.rows.length > 0) {
      return res.json(subscriptionResult.rows[0]);
    }

    // If not in subscriptions table, check user table
    const userResult = await pool.query(
      'SELECT subscription_tier, subscription_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length > 0 && userResult.rows[0].subscription_tier) {
      return res.json({
        tier: userResult.rows[0].subscription_tier,
        stripe_subscription_id: userResult.rows[0].subscription_id,
        user_id: req.user.id
      });
    }

    // Default to Basic if no subscription found
    return res.json({
      tier: 'Basic',
      user_id: req.user.id
    });
  } catch (error) {
    console.error('Error getting user subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 