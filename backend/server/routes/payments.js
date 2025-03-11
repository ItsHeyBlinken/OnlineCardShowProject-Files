const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require('../middleware/authMiddleware');
const { pool } = require('../db');

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
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

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

module.exports = router; 