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
        // Use the updated function that now handles pending downgrades
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
    console.log('Session data:', JSON.stringify(session, null, 2));
    
    const subscriptionId = session.subscription;
    const customerId = session.customer;

    console.log(`Subscription ID: ${subscriptionId}, Customer ID: ${customerId}`);

    // First check if we have this customer in our database
    const userResult = await pool.query(
      'SELECT * FROM users WHERE stripe_customer_id = $1',
      [customerId]
    );

    if (userResult.rows.length === 0) {
      console.error('No user found with Stripe customer ID:', customerId);
      
      // If we don't have the user by stripe_customer_id, check if we have user details in metadata
      if (session.metadata && session.metadata.userId) {
        const userId = session.metadata.userId;
        console.log(`Found userId ${userId} in session metadata, updating user record`);
        
        // Update the user record with the stripe customer id
        await pool.query(
          'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
          [customerId, userId]
        );
        
        // Now try to get the user again
        const updatedUserResult = await pool.query(
          'SELECT * FROM users WHERE id = $1',
          [userId]
        );
        
        if (updatedUserResult.rows.length > 0) {
          const user = updatedUserResult.rows[0];
          console.log(`Updated and found user ${user.id} for customer ${customerId}`);
          
          if (subscriptionId) {
            console.log(`Fetching subscription ${subscriptionId} details from Stripe`);
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await updateSubscriptionInDatabase(subscription);
          }
        } else {
          console.error(`Still couldn't find user with ID ${userId} after update`);
        }
      } else {
        console.error('No userId in metadata and no user with this stripe_customer_id');
      }
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
    console.log('Subscription data:', JSON.stringify(subscription, null, 2));
    
    // Get the price ID from the subscription
    const priceId = subscription.items.data[0].price.id;
    console.log('Price ID from subscription:', priceId);
    
    // Map price IDs to subscription tiers
    // Use environment variables for price IDs
    const priceToTier = {
      [process.env.STRIPE_STARTER_PRICE_ID]: 'Starter',
      [process.env.STRIPE_PRO_PRICE_ID]: 'Pro',
      [process.env.STRIPE_PREMIUM_PRICE_ID]: 'Premium'
    };
    
    console.log('Price ID mapping:', priceToTier);
    
    const tier = priceToTier[priceId] || 'Basic';
    console.log(`Mapped price ${priceId} to tier ${tier}`);
    
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
    const now = new Date();
    
    // Calculate expires_at from subscription current_period_end
    const expiresAt = new Date(subscription.current_period_end * 1000);
    
    // Check if this is the end of a billing period and there's a pending downgrade
    let finalTier = tier;
    if (user.pending_subscription_tier && 
        subscription.current_period_end <= Math.floor(Date.now() / 1000) + 86400) { // Within 24 hours of period end
      console.log(`User ${user.id} has a pending downgrade to ${user.pending_subscription_tier}`);
      
      // Use the pending tier instead of the current tier
      finalTier = user.pending_subscription_tier;
      console.log(`Using pending tier ${finalTier} instead of current tier ${tier}`);
    }
    
    // Update ALL subscription information fields in users table
    try {
      const updateUserResult = await pool.query(
        `UPDATE users SET 
          subscription_tier = $1, 
          subscription_id = $2, 
          subscription_status = $3, 
          stripe_subscription_id = $4, 
          subscription_period_end = $5,
          pending_subscription_tier = CASE 
            WHEN $6::boolean THEN NULL 
            ELSE pending_subscription_tier 
          END
        WHERE id = $7 RETURNING *`,
        [
          finalTier, 
          subscription.id, 
          subscription.status, 
          subscription.id, 
          expiresAt,
          user.pending_subscription_tier && subscription.current_period_end <= Math.floor(Date.now() / 1000) + 86400, // Clear pending if applied
          user.id
        ]
      );
      
      if (updateUserResult.rows.length > 0) {
        console.log('Updated user subscription successfully:', {
          user_id: user.id,
          tier: finalTier,
          subscription_id: subscription.id,
          status: subscription.status,
          expires_at: expiresAt
        });
      } else {
        console.error('User update query ran but no rows were affected');
      }
    } catch (err) {
      console.error('Error updating user subscription:', err);
      console.error('Error detail:', err.detail);
      console.error('This might be because some columns don\'t exist in your users table');
      
      // Try a more basic update if the above fails (in case some columns don't exist)
      try {
        console.log('Attempting simplified update...');
        await pool.query(
          'UPDATE users SET subscription_tier = $1, subscription_id = $2, subscription_status = $3 WHERE id = $4',
          [finalTier, subscription.id, subscription.status, user.id]
        );
        console.log('Basic user subscription update succeeded');
      } catch (fallbackErr) {
        console.error('Even basic update failed:', fallbackErr);
      }
    }
    
    // Check if there's an existing record in subscriptions table
    try {
      const existingSubscription = await pool.query(
        'SELECT id FROM subscriptions WHERE user_id = $1',
        [user.id]
      );
      
      if (existingSubscription.rows.length > 0) {
        // Update existing subscription
        const updateResult = await pool.query(
          `UPDATE subscriptions 
          SET tier = $1, expires_at = $2, stripe_subscription_id = $3, status = $4
          WHERE user_id = $5 RETURNING *`,
          [finalTier, expiresAt, subscription.id, subscription.status, user.id]
        );
        console.log('Updated subscription record:', updateResult.rows[0]);
      } else {
        // Create new subscription record
        const insertResult = await pool.query(
          `INSERT INTO subscriptions 
          (user_id, tier, expires_at, created_at, stripe_subscription_id, status)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [user.id, finalTier, expiresAt, now, subscription.id, subscription.status]
        );
        console.log('Created new subscription record:', insertResult.rows[0]);
      }
    } catch (err) {
      console.error('Error updating subscriptions table:', err);
      console.error('This might be because the subscriptions table does not exist or has different columns');
      console.error('Please run the migration script we created earlier');
    }
    
    // Update seller_profiles if it exists
    try {
      const sellerProfileExists = await pool.query(
        'SELECT user_id FROM seller_profiles WHERE user_id = $1',
        [user.id]
      );
      
      if (sellerProfileExists.rows.length > 0) {
        const updateResult = await pool.query(
          `UPDATE seller_profiles 
          SET subscription_tier = $1, subscription_active = $2
          WHERE user_id = $3 RETURNING *`,
          [finalTier, subscription.status === 'active', user.id]
        );
        console.log('Updated seller profile:', updateResult.rows[0]);
      }
    } catch (err) {
      console.error('Error updating seller_profiles table:', err);
    }
    
    console.log(`Updated user ${user.id} subscription to tier ${finalTier}, expires at ${expiresAt}`);
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
    
    // Set expires_at to current time (subscription ended)
    const now = new Date();
    
    // Update ALL subscription fields to reflect cancelled status
    try {
      const updateUserResult = await pool.query(
        `UPDATE users SET 
          subscription_tier = $1, 
          subscription_status = $2, 
          subscription_period_end = $3
        WHERE id = $4 RETURNING *`,
        [
          'Basic',
          'inactive', 
          now,
          user.id
        ]
      );
      
      if (updateUserResult.rows.length > 0) {
        console.log('Reset user subscription to Basic tier after cancellation:', {
          user_id: user.id,
          new_status: 'inactive'
        });
      } else {
        console.error('User update query ran but no rows were affected');
      }
    } catch (err) {
      console.error('Error updating user subscription on cancellation:', err);
      console.error('Error detail:', err.detail);
      
      // Try a more basic update if the above fails
      try {
        console.log('Attempting simplified cancellation update...');
        await pool.query(
          'UPDATE users SET subscription_tier = $1, subscription_status = $2 WHERE id = $3',
          ['Basic', 'inactive', user.id]
        );
        console.log('Basic user subscription cancellation update succeeded');
      } catch (fallbackErr) {
        console.error('Even basic cancellation update failed:', fallbackErr);
      }
    }
    
    // Update subscriptions table - set expires_at to now (subscription ended)
    try {
      await pool.query(
        `UPDATE subscriptions 
        SET expires_at = $1, status = $2
        WHERE user_id = $3`,
        [now, 'cancelled', user.id]
      );
      console.log('Updated subscription record with cancelled status');
    } catch (err) {
      console.error('Error updating subscriptions table on cancellation:', err);
    }
    
    // Update seller_profiles table if it exists
    try {
      const sellerProfileExists = await pool.query(
        'SELECT user_id FROM seller_profiles WHERE user_id = $1',
        [user.id]
      );
      
      if (sellerProfileExists.rows.length > 0) {
        await pool.query(
          `UPDATE seller_profiles 
          SET subscription_tier = $1, subscription_active = false
          WHERE user_id = $2`,
          ['Basic', user.id]
        );
        console.log('Updated seller profile to Basic tier with inactive status');
      }
    } catch (err) {
      console.error('Error updating seller_profiles table on cancellation:', err);
    }
    
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

// Add a test endpoint to directly update a user to seller role (for debugging only)
router.post('/test-set-seller-role', express.json(), async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }
  
  console.log(`[DEBUG] Manually setting user ${userId} to seller role`);
  
  try {
    // Update user role to seller
    const updateQuery = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING *';
    const userResult = await pool.query(updateQuery, ['seller', userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if seller profile already exists
    const checkProfileQuery = 'SELECT * FROM seller_profiles WHERE user_id = $1';
    const profileResult = await pool.query(checkProfileQuery, [userId]);
    
    // If no seller profile exists, create a basic one
    if (profileResult.rows.length === 0) {
      console.log(`[DEBUG] Creating default seller profile for user ${userId}`);
      // First, let's check the schema of the seller_profiles table
      try {
        const columnsQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'seller_profiles'
        `;
        const columnsResult = await pool.query(columnsQuery);
        console.log('[DEBUG] seller_profiles table columns:', columnsResult.rows.map(row => row.column_name));
        
        // Create a basic profile with only user_id and business_name to avoid schema issues
        const createProfileQuery = `
          INSERT INTO seller_profiles 
            (user_id, business_name) 
          VALUES ($1, $2) 
          RETURNING *
        `;
        const profileValues = [userId, 'My Store'];
        const newProfile = await pool.query(createProfileQuery, profileValues);
        
        return res.status(200).json({ 
          message: 'User role updated to seller successfully. Basic seller profile created.',
          user: userResult.rows[0],
          sellerProfile: newProfile.rows[0]
        });
      } catch (error) {
        console.error('[DEBUG] Error getting table schema or creating profile:', error);
        throw error;
      }
    }
    
    return res.status(200).json({ 
      message: 'User role updated to seller successfully',
      user: userResult.rows[0],
      sellerProfile: profileResult.rows[0]
    });
  } catch (error) {
    console.error('[DEBUG] Error updating user role:', error);
    return res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
});

// Add a test endpoint to set a user's subscription to active
router.post('/test-activate-subscription', express.json(), async (req, res) => {
  try {
    const { userId, tier = 'Starter' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }
    
    console.log(`TEST ENDPOINT: Setting user ${userId} subscription to active with tier ${tier}`);
    
    // First get the current user data to preserve any existing subscription info
    const userResult = await pool.query(
      'SELECT subscription_id, stripe_subscription_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Generate a fake subscription ID if none exists
    const subscriptionId = user.subscription_id || `sub_test_${Date.now()}`;
    const stripeSubscriptionId = user.stripe_subscription_id || subscriptionId;
    
    // Set subscription expiration to 1 month from now
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    // Update the user record - preserve existing IDs
    const updateResult = await pool.query(
      `UPDATE users SET 
        subscription_tier = $1, 
        subscription_id = $2, 
        stripe_subscription_id = $3,
        subscription_status = $4, 
        subscription_period_end = $5,
        pending_subscription_tier = NULL
      WHERE id = $6 RETURNING *`,
      [tier, subscriptionId, stripeSubscriptionId, 'active', expiresAt, userId]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Also update seller_profiles if it exists
    try {
      const sellerProfileResult = await pool.query(
        `UPDATE seller_profiles SET
          subscription_tier = $1,
          subscription_active = true
        WHERE user_id = $2 RETURNING *`,
        [tier, userId]
      );
      
      if (sellerProfileResult.rows.length > 0) {
        console.log('Updated seller profile subscription status');
      }
    } catch (err) {
      console.warn('Error updating seller profile (may not exist):', err.message);
    }
    
    res.status(200).json({
      success: true,
      message: `User subscription activated with tier ${tier}`,
      user: {
        id: updateResult.rows[0].id,
        tier: updateResult.rows[0].subscription_tier,
        status: updateResult.rows[0].subscription_status,
        expires_at: updateResult.rows[0].subscription_period_end,
        subscription_id: updateResult.rows[0].subscription_id,
        stripe_subscription_id: updateResult.rows[0].stripe_subscription_id
      }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Add a test endpoint to set a user's subscription to inactive
router.post('/test-deactivate-subscription', express.json(), async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }
    
    console.log(`TEST ENDPOINT: Setting user ${userId} subscription to inactive (Basic tier)`);
    
    // Update the user record
    const updateResult = await pool.query(
      `UPDATE users SET 
        subscription_tier = 'Basic', 
        subscription_id = NULL, 
        subscription_status = 'inactive', 
        subscription_period_end = NULL
      WHERE id = $1 RETURNING *`,
      [userId]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Also update seller_profiles if it exists
    try {
      const sellerProfileResult = await pool.query(
        `UPDATE seller_profiles SET
          subscription_tier = 'Basic',
          subscription_active = false
        WHERE user_id = $1 RETURNING *`,
        [userId]
      );
      
      if (sellerProfileResult.rows.length > 0) {
        console.log('Updated seller profile subscription status to inactive');
      }
    } catch (err) {
      console.warn('Error updating seller profile (may not exist):', err.message);
    }
    
    res.status(200).json({
      success: true,
      message: 'User subscription deactivated',
      user: {
        id: updateResult.rows[0].id,
        tier: updateResult.rows[0].subscription_tier,
        status: updateResult.rows[0].subscription_status
      }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Add a utility endpoint to manually refresh subscription status
router.post('/refresh-subscription-status', express.json(), async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    console.log(`[DEBUG] Manually refreshing subscription status for user ${userId}`);
    
    // Get user from database with role information
    const userResult = await pool.query(
      'SELECT id, role, stripe_customer_id, stripe_subscription_id, subscription_tier FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // If they have a Stripe subscription ID, refresh from Stripe
    if (user.stripe_subscription_id) {
      try {
        // Get subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
        
        // Update database with current status
        await updateSubscriptionInDatabase(subscription);
        
        return res.status(200).json({
          message: 'Subscription status refreshed successfully from Stripe',
          subscription_id: subscription.id,
          status: subscription.status,
          user_id: userId
        });
      } catch (stripeError) {
        if (stripeError.code === 'resource_missing') {
          // Subscription no longer exists in Stripe
          // Check if they're a seller - if yes, keep current tier but ensure active status
          if (user.role === 'seller') {
            // Preserve their current tier
            const currentTier = user.subscription_tier || 'Basic';
            console.log(`Stripe subscription not found for seller ${userId}, but preserving current tier: ${currentTier}`);
            
            await pool.query(
              `UPDATE users SET 
               subscription_status = 'active'
               WHERE id = $1`,
              [userId]
            );
            
            return res.status(200).json({
              message: `Stripe subscription not found, but seller role maintained with ${currentTier} active tier`,
              user_id: userId,
              tier: currentTier,
              status: 'active'
            });
          } else {
            // Not a seller, set to inactive but preserve tier
            const currentTier = user.subscription_tier || 'Basic';
            
            await pool.query(
              `UPDATE users SET 
               subscription_status = 'inactive'
               WHERE id = $1`,
              [userId]
            );
            
            return res.status(200).json({
              message: 'Subscription not found in Stripe, status updated to inactive but tier preserved',
              user_id: userId,
              tier: currentTier
            });
          }
        }
        
        throw stripeError;
      }
    } else {
      // No Stripe subscription ID
      // Check if they're a seller - preserve their current tier but ensure active status
      if (user.role === 'seller') {
        // Get their current tier - only default to Basic if they don't have one set
        const currentTier = user.subscription_tier || 'Basic';
        console.log(`Refreshing subscription for seller ${userId} - preserving current tier: ${currentTier}`);
        
        // Update to ensure they have active status for their current tier
        await pool.query(
          `UPDATE users SET 
           subscription_status = 'active'
           WHERE id = $1 RETURNING subscription_tier, subscription_status`,
          [userId]
        );
        
        return res.status(200).json({
          message: `Seller subscription status refreshed successfully - tier maintained as ${currentTier}`,
          user_id: userId,
          tier: currentTier,
          status: 'active'
        });
      } else {
        // Not a seller or has no subscription - don't change their tier
        return res.status(200).json({
          message: 'User is not a seller or has no subscription',
          user_id: userId,
          role: user.role,
          tier: user.subscription_tier || 'Basic'
        });
      }
    }
  } catch (error) {
    console.error('Error refreshing subscription status:', error);
    res.status(500).json({ 
      message: 'Failed to refresh subscription status',
      error: error.message
    });
  }
});

module.exports = router; 