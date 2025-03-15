const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require('../middleware/authMiddleware');
const pool = require('../db');

// Create a payment intent (step 1 of Stripe payment)
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'usd', items, tax } = req.body;

    // Validate request
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Round to ensure whole number (Stripe requires amount in cents/smallest currency unit)
      currency,
      metadata: {
        user_id: req.user.id,
        order_items: JSON.stringify(items),
        tax_amount: tax ? tax.toString() : '0'
      }
    });

    // Send the client secret to the client
    res.json({ 
      clientSecret: paymentIntent.client_secret 
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Error creating payment intent' });
  }
});

// Create a subscription checkout session for seller plans
router.post('/create-subscription-checkout', authenticateToken, async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id || !req.user.email) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'User not authenticated or user information not available'
      });
    }
    
    // Handle both formats - either tier name or direct priceId
    const { tier, priceId: directPriceId } = req.body;
    let { successUrl, cancelUrl } = req.body;
    
    let priceId;
    let tierName;
    
    // If direct priceId is provided, use it (from SubscriptionManagementPage)
    if (directPriceId) {
      console.log(`Using provided price ID: ${directPriceId}`);
      priceId = directPriceId;
      
      // Try to determine tier name from the price ID
      if (directPriceId === process.env.STRIPE_STARTER_PRICE_ID) {
        tierName = 'Starter';
      } else if (directPriceId === process.env.STRIPE_PRO_PRICE_ID) {
        tierName = 'Pro';
      } else if (directPriceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
        tierName = 'Premium';
      } else {
        tierName = 'Unknown';
      }
    }
    // Otherwise use the tier parameter (from BecomeSellerPage)
    else if (tier) {
      switch (tier) {
        case 'Basic':
          // Basic is the free tier, so no price ID needed
          tierName = 'Basic';
          return res.status(400).json({ 
            error: 'Invalid tier for checkout',
            message: 'The Basic plan is free and does not require checkout'
          });
        case 'Starter':
          priceId = process.env.STRIPE_STARTER_PRICE_ID;
          tierName = 'Starter';
          break;
        case 'Pro':
          priceId = process.env.STRIPE_PRO_PRICE_ID;
          tierName = 'Pro';
          break;
        case 'Premium':
          priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
          tierName = 'Premium';
          break;
        default:
          return res.status(400).json({ error: 'Invalid subscription tier' });
      }
    } else {
      return res.status(400).json({ error: 'Either tier or priceId is required' });
    }
    
    if (!successUrl || !cancelUrl) {
      // Default URLs if not provided
      successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription-management?success=true`;
      cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription-management?cancelled=true`;
    }
    
    if (!priceId) {
      return res.status(500).json({ 
        error: 'Price ID not configured for this tier',
        message: `Missing price ID for tier: ${tierName}. Please check your .env file.`
      });
    }
    
    console.log(`Creating checkout for tier ${tierName} with price ID ${priceId}`);
    
    // Get existing customer or create a new one
    let customerId;
    const existingCustomer = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (existingCustomer.rows.length > 0 && existingCustomer.rows[0].stripe_customer_id) {
      customerId = existingCustomer.rows[0].stripe_customer_id;
    } else {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          user_id: req.user.id
        }
      });
      
      customerId = customer.id;
      
      // Save the customer ID in the database
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, req.user.id]
      );
    }
    
    try {
      // Create a Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          }
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          user_id: req.user.id,
          tier: tierName,
          is_seller_subscription: 'true'
        }
      });
      
      console.log(`Created checkout session: ${session.id} for tier ${tierName}`);
      
      // Return both the URL and sessionId to support both frontend implementations
      res.json({ 
        url: session.url,
        sessionId: session.id 
      });
    } catch (stripeError) {
      console.error('Stripe API Error:', stripeError);
      
      if (stripeError.type === 'StripeInvalidRequestError' && 
          stripeError.raw && 
          stripeError.raw.code === 'resource_missing') {
        return res.status(400).json({
          error: 'Invalid price ID',
          message: `The price ID for the ${tierName} tier (${priceId}) does not exist in your Stripe account. Please check your Stripe Dashboard and update your .env file with the correct price IDs.`,
          details: stripeError.message
        });
      }
      
      throw stripeError; // Re-throw for the outer catch block
    }
    
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
});

// Verify subscription checkout session and activate subscription
router.get('/verify-subscription-checkout', authenticateToken, async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'User not authenticated or user information not available'
      });
    }
    
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription']
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Checkout session not found' });
    }
    
    // Verify that this session belongs to the current user
    const stripeCustomerId = session.customer;
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE stripe_customer_id = $1 AND id = $2',
      [stripeCustomerId, req.user.id]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'This checkout session does not belong to the current user' });
    }
    
    // Check if the payment was successful
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        error: 'Payment not completed', 
        status: session.payment_status 
      });
    }
    
    // Get subscription details
    const subscription = session.subscription;
    if (!subscription) {
      return res.status(400).json({ error: 'No subscription found in the session' });
    }
    
    // Retrieve the subscription to get its period end (for expires_at)
    const subscriptionDetails = await stripe.subscriptions.retrieve(subscription.id);
    const expiresAt = new Date(subscriptionDetails.current_period_end * 1000); // Convert from Unix timestamp
    const now = new Date();
    
    const subscriptionTier = session.metadata.tier;
    
    // Check if the user already has a subscription record
    const existingSubscription = await pool.query(
      'SELECT id FROM subscriptions WHERE user_id = $1',
      [req.user.id]
    );
    
    if (existingSubscription.rows.length > 0) {
      // Update existing subscription
      await pool.query(
        `UPDATE subscriptions 
        SET tier = $1, expires_at = $2 
        WHERE user_id = $3`,
        [subscriptionTier, expiresAt, req.user.id]
      );
    } else {
      // Create new subscription record
      await pool.query(
        `INSERT INTO subscriptions 
        (user_id, tier, expires_at, created_at)
        VALUES ($1, $2, $3, $4)`,
        [req.user.id, subscriptionTier, expiresAt, now]
      );
    }
    
    // Update user information
    await pool.query(
      `UPDATE users SET subscription_tier = $1 WHERE id = $2`,
      [subscriptionTier, req.user.id]
    );
    
    // Update seller_profiles subscription information if the table exists
    try {
      const sellerProfileExists = await pool.query(
        'SELECT user_id FROM seller_profiles WHERE user_id = $1',
        [req.user.id]
      );
      
      if (sellerProfileExists.rows.length > 0) {
        await pool.query(
          `UPDATE seller_profiles 
          SET subscription_tier = $1, subscription_active = true
          WHERE user_id = $2`,
          [subscriptionTier, req.user.id]
        );
      }
    } catch (err) {
      // If seller_profiles table doesn't exist, just continue
      console.log('Note: seller_profiles table may not exist, continuing without updating it');
    }
    
    res.json({
      success: true,
      message: 'Subscription verified and activated successfully',
      tier: subscriptionTier,
      subscription_id: subscription.id,
      expires_at: expiresAt
    });
    
  } catch (error) {
    console.error('Error verifying subscription:', error);
    res.status(500).json({ 
      error: 'Failed to verify subscription', 
      message: error.message
    });
  }
});

// Webhook endpoint for Stripe events (for handling successful payment events)
// NOTE: The middleware for this route is set up in server.js with express.raw
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful:', paymentIntent.id);
      
      // Here you could add logic to:
      // 1. Update order status in your database
      // 2. Send confirmation email to customer
      // 3. Notify seller about the new order
      break;
      
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      console.log('Payment failed:', failedPaymentIntent.id, failedPaymentIntent.last_payment_error?.message);
      break;
    
    // Handle subscription events
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      console.log('Session details:', {
        mode: session.mode,
        customerId: session.customer,
        subscriptionId: session.subscription,
        paymentStatus: session.payment_status
      });
      
      // Only process if this is a subscription checkout
      if (session.mode === 'subscription') {
        try {
          console.log('Processing subscription checkout completion');
          await handleSuccessfulSubscription(session);
          console.log('Successfully updated user subscription from session', session.id);
        } catch (error) {
          console.error('Error handling subscription checkout completion:', error);
        }
      }
      break;
      
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log(`Subscription ${event.type}:`, subscription.id);
      
      try {
        await updateUserSubscription(subscription);
      } catch (error) {
        console.error(`Error handling ${event.type}:`, error);
      }
      break;
      
    case 'customer.subscription.deleted':
      const cancelledSubscription = event.data.object;
      console.log('Subscription cancelled:', cancelledSubscription.id);
      
      try {
        await handleCancelledSubscription(cancelledSubscription);
      } catch (error) {
        console.error('Error handling subscription cancellation:', error);
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

// Helper function to handle successful subscription checkout
async function handleSuccessfulSubscription(session) {
  // Get the customer ID from the session
  const customerId = session.customer;
  
  if (!customerId) {
    console.error('No customer ID in session:', session.id);
    return;
  }
  
  // Find the user associated with this customer ID
  const userResult = await pool.query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );
  
  if (userResult.rows.length === 0) {
    console.error('No user found for Stripe customer:', customerId);
    return;
  }
  
  const userId = userResult.rows[0].id;
  
  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  // Update the user's subscription in the database
  await updateUserSubscriptionInDatabase(userId, subscription);
}

// Helper function to update user subscription in database
async function updateUserSubscription(subscription) {
  // Get the customer ID from the subscription
  const customerId = subscription.customer;
  
  // Find the user associated with this customer ID
  const userResult = await pool.query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );
  
  if (userResult.rows.length === 0) {
    console.error('No user found for Stripe customer:', customerId);
    return;
  }
  
  const userId = userResult.rows[0].id;
  
  // Update the user's subscription in the database
  await updateUserSubscriptionInDatabase(userId, subscription);
}

// Helper function to handle cancelled subscription
async function handleCancelledSubscription(subscription) {
  // Get the customer ID from the subscription
  const customerId = subscription.customer;
  
  // Find the user associated with this customer ID
  const userResult = await pool.query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );
  
  if (userResult.rows.length === 0) {
    console.error('No user found for Stripe customer:', customerId);
    return;
  }
  
  const userId = userResult.rows[0].id;
  
  // Reset the user's subscription to Basic
  await pool.query(
    'UPDATE users SET subscription_tier = $1, subscription_id = NULL, subscription_status = $2 WHERE id = $3',
    ['Basic', 'inactive', userId]
  );
  
  console.log(`User ${userId} subscription reset to Basic after cancellation`);
}

// Common function to update user subscription in database
async function updateUserSubscriptionInDatabase(userId, subscription) {
  // Get the subscription item (should be just one for our use case)
  const subscriptionItem = subscription.items.data[0];
  
  if (!subscriptionItem) {
    console.error('No subscription items found for subscription:', subscription.id);
    return;
  }
  
  // Get the price ID
  const priceId = subscriptionItem.price.id;
  
  // Map price ID to subscription tier
  let subscriptionTier;
  // Match based on the price IDs in your frontend
  if (priceId.includes('price_1R2IxRH9O7KWDH4l')) {
    subscriptionTier = 'Starter';
  } else if (priceId.includes('price_1R2Iy8H9O7KWDH4l')) {
    subscriptionTier = 'Pro';
  } else if (priceId.includes('price_1R2IydH9O7KWDH4l')) {
    subscriptionTier = 'Premium';
  } else {
    // This is a fallback - in production you would have a proper mapping
    console.error('Unknown price ID:', priceId);
    subscriptionTier = 'Unknown';
  }
  
  // Update the user's subscription details in the database
  await pool.query(
    'UPDATE users SET subscription_tier = $1, subscription_id = $2, subscription_status = $3 WHERE id = $4',
    [subscriptionTier, subscription.id, subscription.status, userId]
  );
  
  console.log(`Updated user ${userId} to ${subscriptionTier} subscription`);
}

// Handle Stripe Connect OAuth callback
router.get('/stripe/connect/callback', authenticateToken, async (req, res) => {
  const { code, state } = req.query;
  
  try {
    // Exchange the authorization code for an access token
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    // Get the connected account ID
    const connectedAccountId = response.stripe_user_id;

    // Store the connected account ID in your database
    await pool.query(
      'UPDATE seller_profiles SET stripe_account_id = $1 WHERE user_id = $2',
      [connectedAccountId, req.user.id]
    );

    // Redirect to the seller dashboard with success message
    res.redirect('/seller/dashboard?setup=success');
  } catch (error) {
    console.error('Error connecting Stripe account:', error);
    res.redirect('/seller/dashboard?error=stripe_connect_failed');
  }
});

// Add this route to your payments.js file
router.post('/sync-subscription-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Retrieve the user's subscription from Stripe
    const customer = await stripe.customers.retrieve(req.user.stripe_customer_id, {
      expand: ['subscriptions']
    });
    
    if (!customer.subscriptions || customer.subscriptions.data.length === 0) {
      return res.status(404).json({ message: 'No active subscription found' });
    }
    
    // Get the most recent active subscription
    const subscription = customer.subscriptions.data[0];
    
    // Map Stripe price IDs to subscription tiers
    const priceToTier = {
      'price_1R2IxRH9O7KWDH4lOEw2MHsS': 'Starter',
      'price_1R2Iy8H9O7KWDH4loZlP1dAU': 'Pro',
      'price_1R2IydH9O7KWDH4llJwpAAV5': 'Premium'
    };
    
    // Determine tier from price ID
    const tier = priceToTier[subscription.items.data[0].price.id] || 'Basic';
    
    // Update the user in the database
    await pool.query(
      'UPDATE users SET subscription_tier = $1, subscription_id = $2 WHERE id = $3',
      [tier, subscription.id, userId]
    );
    
    res.status(200).json({ message: 'Subscription status updated successfully' });
  } catch (error) {
    console.error('Error syncing subscription status:', error);
    res.status(500).json({ message: 'Failed to sync subscription status' });
  }
});

// Temporary endpoint for manual subscription updates
router.post('/manual-subscription-update', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Manual subscription update for user ${userId}`);
    
    // Get the user's Stripe customer ID
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const stripeCustomerId = userResult.rows[0].stripe_customer_id;
    
    if (!stripeCustomerId) {
      return res.status(400).json({ message: 'User has no Stripe customer ID' });
    }
    
    // Fetch the customer's subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1
    });
    
    if (subscriptions.data.length === 0) {
      return res.status(404).json({ message: 'No active subscriptions found' });
    }
    
    // Get the subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    
    // Map price IDs to subscription tiers
    const priceToTier = {
      'price_1R2IxRH9O7KWDH4lOEw2MHsS': 'Starter',
      'price_1R2Iy8H9O7KWDH4loZlP1dAU': 'Pro',
      'price_1R2IydH9O7KWDH4llJwpAAV5': 'Premium'
    };
    
    const tier = priceToTier[priceId] || 'Basic';
    
    // Try to update both columns, but handle errors gracefully
    try {
      // Check if the subscription_id column exists
      const checkColumnResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'subscription_id'
      `);
      
      if (checkColumnResult.rows.length > 0) {
        // If column exists, update both
        await pool.query(
          'UPDATE users SET subscription_tier = $1, subscription_id = $2 WHERE id = $3',
          [tier, subscription.id, userId]
        );
      } else {
        // If column doesn't exist, just update the tier
        await pool.query(
          'UPDATE users SET subscription_tier = $1 WHERE id = $2',
          [tier, userId]
        );
      }
      
      console.log(`User ${userId} subscription updated to: ${tier}`);
      
      res.status(200).json({
        success: true,
        message: 'Subscription updated successfully',
        tier
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      
      // As a fallback, try updating just the tier
      await pool.query(
        'UPDATE users SET subscription_tier = $1 WHERE id = $2',
        [tier, userId]
      );
      
      res.status(200).json({
        success: true,
        message: 'Subscription tier updated (limited update)',
        tier
      });
    }
  } catch (error) {
    console.error('Error in manual subscription update:', error);
    res.status(500).json({ message: 'Failed to update subscription' });
  }
});

// Add this diagnostic endpoint
router.get('/subscription-debug', authenticateToken, async (req, res) => {
  try {
    // 1. Get user info
    const userId = req.user.id;
    console.log('=== SUBSCRIPTION DEBUG ===');
    console.log(`User ID: ${userId}`);
    
    // 2. Get user from database including current subscription info
    const userResult = await pool.query(
      'SELECT id, email, username, stripe_customer_id, subscription_tier, subscription_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      console.log('ERROR: User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    console.log('User from database:', user);
    
    // 3. Check if user has a Stripe customer ID
    if (!user.stripe_customer_id) {
      console.log('ERROR: User has no Stripe customer ID');
      return res.status(400).json({ error: 'No Stripe customer ID' });
    }
    
    // 4. Query Stripe for subscriptions
    console.log(`Querying Stripe for customer: ${user.stripe_customer_id}`);
    let stripeCustomer;
    try {
      stripeCustomer = await stripe.customers.retrieve(user.stripe_customer_id, {
        expand: ['subscriptions']
      });
      console.log('Stripe customer retrieved successfully');
    } catch (stripeErr) {
      console.log('ERROR: Failed to retrieve Stripe customer:', stripeErr.message);
      return res.status(500).json({ error: 'Stripe customer retrieval failed', details: stripeErr.message });
    }
    
    // 5. Check for subscriptions
    const subscriptions = stripeCustomer.subscriptions?.data || [];
    console.log(`Found ${subscriptions.length} subscriptions`);
    
    // 6. Debug output with all relevant information
    const diagnosticData = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        stripe_customer_id: user.stripe_customer_id,
        current_subscription_tier: user.subscription_tier,
        current_subscription_id: user.subscription_id
      },
      stripe: {
        customer_id: user.stripe_customer_id,
        customer_exists: !!stripeCustomer,
        subscription_count: subscriptions.length,
        subscriptions: subscriptions.map(sub => ({
          id: sub.id,
          status: sub.status,
          price_id: sub.items.data[0]?.price.id,
          interval: sub.items.data[0]?.plan.interval,
          created: new Date(sub.created * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString()
        }))
      }
    };
    
    // 7. Return diagnostic data
    console.log('Diagnostic data:', JSON.stringify(diagnosticData, null, 2));
    res.json({ success: true, diagnostic: diagnosticData });
    
  } catch (error) {
    console.error('Diagnostic endpoint error:', error);
    res.status(500).json({ error: 'Diagnostic failed', message: error.message });
  }
});

// Simplified force update endpoint that only updates the tier
router.post('/force-subscription-update', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tier } = req.body;
    
    if (!tier || !['Starter', 'Pro', 'Premium'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier. Must be Starter, Pro, or Premium' });
    }
    
    console.log(`Forcing update of user ${userId} to tier: ${tier}`);
    
    // Only update the subscription_tier column
    const updateResult = await pool.query(
      'UPDATE users SET subscription_tier = $1 WHERE id = $2 RETURNING *',
      [tier, userId]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({ error: 'Database update failed' });
    }
    
    console.log(`User ${userId} subscription updated to: ${tier}`);
    
    res.json({ 
      success: true, 
      message: `Subscription updated to ${tier}`, 
      user: {
        id: updateResult.rows[0].id,
        subscription_tier: updateResult.rows[0].subscription_tier
      }
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Update failed', message: error.message });
  }
});

// Add this endpoint
router.post('/fix-subscription-id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Missing subscription ID' });
    }
    
    // Update just the subscription_id
    await pool.query(
      'UPDATE users SET subscription_id = $1 WHERE id = $2',
      [subscriptionId, userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Subscription ID updated successfully',
      subscription_id: subscriptionId
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Update failed', message: error.message });
  }
});

// Add this admin endpoint for cleaning up subscriptions
router.post('/cleanup-subscriptions', auth, async (req, res) => {
  try {
    // Verify this is an admin account
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { customerId, keepSubscriptionId } = req.body;
    
    if (!customerId || !keepSubscriptionId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['customerId', 'keepSubscriptionId']
      });
    }
    
    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active'
    });
    
    // Track results
    const results = {
      kept: null,
      cancelled: []
    };
    
    // Process each subscription
    for (const subscription of subscriptions.data) {
      if (subscription.id === keepSubscriptionId) {
        // Keep this one
        results.kept = subscription.id;
      } else {
        // Cancel all others
        await stripe.subscriptions.cancel(subscription.id);
        results.cancelled.push(subscription.id);
      }
    }
    
    res.json({
      success: true,
      message: `Kept subscription ${results.kept} and cancelled ${results.cancelled.length} others`,
      results
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Cleanup failed', message: error.message });
  }
});

// Add this endpoint for direct fixes
router.get('/fix-subscription', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get the user's Stripe customer ID
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const stripeCustomerId = userResult.rows[0].stripe_customer_id;
    
    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer ID' });
    }
    
    // Get the user's subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 10
    });
    
    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active subscriptions found' });
    }
    
    // Get the most recent subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    
    // Map price IDs to tiers
    const priceToTier = {
      'price_1R2IxRH9O7KWDH4lOEw2MHsS': 'Starter',
      'price_1R2Iy8H9O7KWDH4loZlP1dAU': 'Pro',
      'price_1R2IydH9O7KWDH4llJwpAAV5': 'Premium'
    };
    
    const tier = priceToTier[priceId] || 'Basic';
    
    // Update both tier and ID
    await pool.query(
      'UPDATE users SET subscription_tier = $1, subscription_id = $2 WHERE id = $3',
      [tier, subscription.id, userId]
    );
    
    // Return success
    res.json({
      success: true,
      message: 'Subscription fixed',
      tier: tier,
      subscription_id: subscription.id
    });
  } catch (error) {
    console.error('Error fixing subscription:', error);
    res.status(500).json({ error: 'Fix failed', message: error.message });
  }
});

// Downgrade a subscription (schedule update at end of current period)
router.post('/downgrade-subscription', authenticateToken, async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'User not authenticated or user information not available'
      });
    }
    
    const { newTier } = req.body;
    console.log(`Downgrade request received - User ID: ${req.user.id}, New Tier: ${newTier}`);
    
    if (!newTier) {
      return res.status(400).json({ error: 'New tier is required' });
    }
    
    // Validate the tier
    const validTiers = ['Basic', 'Starter', 'Pro', 'Premium'];
    if (!validTiers.includes(newTier)) {
      console.log(`Invalid tier specified: ${newTier}`);
      return res.status(400).json({ error: 'Invalid tier specified' });
    }
    
    // Get the user's subscription information
    const userResult = await pool.query(
      'SELECT subscription_tier, subscription_id, stripe_subscription_id, subscription_period_end FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`User not found: ${req.user.id}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const currentTier = user.subscription_tier || 'Basic';
    console.log(`User current tier: ${currentTier}, Requested downgrade to: ${newTier}`);
    
    // Tier levels for comparison
    const tierLevels = {
      'Basic': 0,
      'Starter': 1,
      'Pro': 2,
      'Premium': 3
    };
    console.log(`Tier level comparison: Current tier(${currentTier}): ${tierLevels[currentTier]}, New tier(${newTier}): ${tierLevels[newTier]}`);
    
    // Check if the new tier is actually a downgrade
    if (tierLevels[newTier] >= tierLevels[currentTier]) {
      return res.status(400).json({ 
        error: 'Invalid downgrade', 
        message: newTier === currentTier
          ? `You are already on the ${currentTier} tier. No downgrade needed.`
          : `Cannot downgrade from ${currentTier} to ${newTier} as it's not a lower tier.`
      });
    }
    
    // Get the subscription ID from the database
    const subscriptionId = user.stripe_subscription_id || user.subscription_id;
    
    if (!subscriptionId) {
      return res.status(400).json({ 
        error: 'No active subscription', 
        message: 'User does not have an active subscription to downgrade'
      });
    }
    
    // Check if this is a test subscription (starts with "sub_test_")
    const isTestSubscription = subscriptionId.startsWith('sub_test_');
    console.log(`Subscription type: ${isTestSubscription ? 'Test subscription' : 'Stripe subscription'} - ID: ${subscriptionId}`);
    
    // Current subscription end date - default to 30 days from now for test subscriptions
    let currentPeriodEnd = user.subscription_period_end 
      ? new Date(user.subscription_period_end) 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    if (isTestSubscription) {
      // For test subscriptions, just update the database directly
      try {
        // Update user record with pending downgrade tier
        await pool.query(
          `UPDATE users SET 
           pending_subscription_tier = $1
           WHERE id = $2`,
          [newTier, req.user.id]
        );
        
        return res.json({
          success: true,
          message: `Your test subscription will be downgraded to ${newTier} at the end of your current billing period`,
          effective_date: currentPeriodEnd.toISOString(),
          current_tier: currentTier,
          new_tier: newTier
        });
      } catch (error) {
        console.error('Error updating test subscription:', error);
        return res.status(500).json({ 
          error: 'Failed to update test subscription', 
          message: error.message
        });
      }
    } else {
      // For real Stripe subscriptions, proceed with Stripe API calls
      let stripeSubscription;
      
      try {
        // Retrieve the current subscription from Stripe
        stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      } catch (stripeError) {
        console.error('Error retrieving Stripe subscription:', stripeError);
        
        // If Stripe can't find the subscription but it's in our database,
        // we'll treat it as a test subscription even if it doesn't have the prefix
        if (stripeError.code === 'resource_missing') {
          console.log(`Stripe subscription not found, treating as test subscription: ${subscriptionId}`);
          
          // Update user record with pending downgrade tier
          await pool.query(
            `UPDATE users SET 
             pending_subscription_tier = $1
             WHERE id = $2`,
            [newTier, req.user.id]
          );
          
          return res.json({
            success: true,
            message: `Your subscription will be downgraded to ${newTier} at the end of your current billing period`,
            effective_date: currentPeriodEnd.toISOString(),
            current_tier: currentTier,
            new_tier: newTier
          });
        }
        
        return res.status(400).json({ 
          error: 'Failed to retrieve subscription', 
          message: stripeError.message
        });
      }
      
      // Map tier names to price IDs
      let newPriceId;
      
      if (newTier === 'Basic') {
        // For Basic tier, we'll cancel the subscription at the end of the current period
        try {
          // Update the subscription to cancel at period end
          const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
          });
          
          // Store the scheduled downgrade in the database
          await pool.query(
            `UPDATE users SET 
             pending_subscription_tier = $1
             WHERE id = $2`,
            [newTier, req.user.id]
          );
          
          // Calculate when the downgrade will take effect
          const downgradeDate = new Date(updatedSubscription.current_period_end * 1000);
          
          return res.json({
            success: true,
            message: `Your subscription will be downgraded to ${newTier} at the end of your current billing period`,
            effective_date: downgradeDate.toISOString(),
            current_tier: currentTier,
            new_tier: newTier
          });
        } catch (stripeError) {
          console.error('Error cancelling subscription:', stripeError);
          return res.status(500).json({ 
            error: 'Failed to cancel subscription', 
            message: stripeError.message
          });
        }
      } else {
        // For other tiers, we'll update the subscription with a new price
        switch (newTier) {
          case 'Starter':
            newPriceId = process.env.STRIPE_STARTER_PRICE_ID;
            break;
          case 'Pro':
            newPriceId = process.env.STRIPE_PRO_PRICE_ID;
            break;
          default:
            return res.status(400).json({ error: 'Invalid tier for downgrade' });
        }
        
        if (!newPriceId) {
          return res.status(500).json({ 
            error: 'Price ID not configured for this tier',
            message: `Missing price ID for tier: ${newTier}. Please check your .env file.`
          });
        }
        
        try {
          // Update the subscription with the new price at the end of the billing period
          const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            proration_behavior: 'none',
            billing_cycle_anchor: 'unchanged',
            items: [{
              id: stripeSubscription.items.data[0].id,
              price: newPriceId,
            }],
          });
          
          // Store the scheduled downgrade in the database
          await pool.query(
            `UPDATE users SET 
             pending_subscription_tier = $1
             WHERE id = $2`,
            [newTier, req.user.id]
          );
          
          // Calculate when the downgrade will take effect
          const downgradeDate = new Date(updatedSubscription.current_period_end * 1000);
          
          return res.json({
            success: true,
            message: `Your subscription will be downgraded to ${newTier} at the end of your current billing period`,
            effective_date: downgradeDate.toISOString(),
            current_tier: currentTier,
            new_tier: newTier
          });
        } catch (stripeError) {
          console.error('Error updating subscription:', stripeError);
          return res.status(500).json({ 
            error: 'Failed to update subscription', 
            message: stripeError.message
          });
        }
      }
    }
  } catch (error) {
    console.error('Error downgrading subscription:', error);
    res.status(500).json({ 
      error: 'Failed to downgrade subscription',
      message: error.message
    });
  }
});

module.exports = router; 