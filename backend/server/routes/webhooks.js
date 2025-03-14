const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../db');

// Raw body middleware for Stripe webhook (for handling raw JSON body)
const stripeWebhookMiddleware = express.raw({ type: 'application/json' });

// Create a special middleware for webhook routes (for handling raw JSON body)
const webhookMiddleware = (req, res, next) => {
  // Get raw body for Stripe signature verification (for handling raw JSON body)
  const chunks = [];
  
  req.on('data', (chunk) => chunks.push(chunk));
  
  req.on('end', () => {
    if (chunks.length) {
      req.rawBody = Buffer.concat(chunks);
    }
    next();
  });
};

// Webhook route with raw body handling (for handling raw JSON body)
router.post('/stripe', webhookMiddleware, stripeWebhookMiddleware, async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
      
    // Verify Stripe signature if in production or if webhook secret exists (for handling raw JSON body)
    if ((process.env.NODE_ENV === 'production' || webhookSecret) && sig) {
      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          sig,
          webhookSecret
        );
        console.log('Webhook signature verified');
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // For development without signature (or direct testing)          
      try {
        const rawBody = req.rawBody ? req.rawBody.toString('utf8') : '';
        event = rawBody ? JSON.parse(rawBody) : req.body;
        console.log('Webhook received in development mode (no signature verification)');
      } catch (err) {
        console.error('Error parsing webhook body:', err);
        return res.status(400).send('Webhook Error: Invalid JSON');
      }
    }
    
    console.log(`Processing webhook event: ${event.type}`);
    
    // Handle different event types (for handling raw JSON body)
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // Only process subscription checkouts
        if (session.mode === 'subscription') {
          await handleCheckoutComplete(session);
        }
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await updateSubscriptionInDatabase(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionCancelled(subscription);
        break;
      }
    }
    
    // Return a 200 response to acknowledge receipt of the event (for handling raw JSON body)
    res.status(200).json({received: true});
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({error: 'Webhook processing failed'});
  }
});

// Add the functions for handling different webhook events (for handling raw JSON body)
async function handleCheckoutComplete(session) {
  try {
    console.log('Handling checkout.session.completed:', session.id);
    
    const subscriptionId = session.subscription;
    const customerId = session.customer;

    const userResult = await pool.query(
      'SELECT * FROM users WHERE stripe_customer_id = $1',
      [customerId]
    );

    if (userResult.rows.length === 0) {
      console.error('No user found with Stripe customer ID:', customerId);
      return;
    }

    const user = userResult.rows[0];
    console.log(`Found user ${user.id} for customer ${customerId}`);

    if (subscriptionId) {
      console.log(`Fetching subscription ${subscriptionId} details from Stripe`);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await updateSubscriptionInDatabase(subscription);
    } else {
      console.warn('No subscription ID in session:', session.id);
    }
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function updateSubscriptionInDatabase(subscription) {
  try {
    console.log('Updating subscription in database:', subscription.id);
    
    // Get the price ID from the subscription
    const priceId = subscription.items.data[0].price.id;
    
    // Map price IDs to subscription tiers
    const priceToTier = {
      'price_1R2IxRH9O7KWDH4lOEw2MHsS': 'Starter',
      'price_1R2Iy8H9O7KWDH4loZlP1dAU': 'Pro',
      'price_1R2IydH9O7KWDH4llJwpAAV5': 'Premium'
    };
    
    const tier = priceToTier[priceId] || 'Basic';
    
    // Find the user by their Stripe customer ID
    const userResult = await pool.query(
      'SELECT * FROM users WHERE stripe_customer_id = $1',
      [subscription.customer]
    );
    
    if (userResult.rows.length === 0) {
      console.error('No user found with Stripe customer ID:', subscription.customer);
      return;
    }
    
    const user = userResult.rows[0];
    
    // Update the user's subscription information
    await pool.query(
      'UPDATE users SET subscription_tier = $1, subscription_id = $2 WHERE id = $3',
      [tier, subscription.id, user.id]
    );
    
    console.log(`Updated user ${user.id} subscription to tier ${tier}`);
  } catch (error) {
    console.error('Error updating subscription in database:', error);
  }
}

async function handleSubscriptionCancelled(subscription) {
  try {
    console.log('Handling subscription cancellation:', subscription.id);
    
    // Find the user by their Stripe customer ID
    const userResult = await pool.query(
      'SELECT * FROM users WHERE stripe_customer_id = $1',
      [subscription.customer]
    );
    
    if (userResult.rows.length === 0) {
      console.error('No user found with Stripe customer ID:', subscription.customer);
      return;
    }
    
    const user = userResult.rows[0];
    
    // Reset the user to Basic tier
    await pool.query(
      'UPDATE users SET subscription_tier = $1, subscription_id = NULL WHERE id = $2',
      ['Basic', user.id]
    );
    
    console.log(`Reset user ${user.id} to Basic tier after subscription cancellation`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

// Add a test endpoint for development
router.post('/test-subscription-update', async (req, res) => {
  try {
    const { userId, tier } = req.body;
    
    if (!userId || !tier) {
      return res.status(400).json({ error: 'Missing userId or tier' });
    }
    
    // Update the user's subscription tier directly
    await pool.query(
      'UPDATE users SET subscription_tier = $1 WHERE id = $2',
      [tier, userId]
    );
    
    console.log(`Test endpoint: Updated user ${userId} subscription to tier ${tier}`);
    res.status(200).json({ success: true, tier });
  } catch (error) {
    console.error('Error in test subscription update:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Basic test route to verify routing is working
router.get('/test', (req, res) => {
  res.send('Webhook routes are working!');
});

// Test endpoint for subscription updates
router.post('/test-webhook', express.json(), async (req, res) => {
  try {
    const { userId, tier, subscriptionId = 'test_subscription_123' } = req.body;
    
    if (!userId || !tier) {
      return res.status(400).json({ error: 'Missing userId or tier' });
    }
    
    console.log(`TEST WEBHOOK: Updating user ${userId} to tier ${tier} with subscription ID ${subscriptionId}`);
    
    // Update BOTH subscription_tier AND subscription_id
    const result = await pool.query(
      'UPDATE users SET subscription_tier = $1, subscription_id = $2 WHERE id = $3 RETURNING *',
      [tier, subscriptionId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `User with ID ${userId} not found` });
    }
    
    console.log(`TEST WEBHOOK: Updated database record:`, result.rows[0]);
    
    res.status(200).json({ 
      success: true, 
      message: `Updated user ${userId} to tier ${tier} with subscription ID ${subscriptionId}`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 