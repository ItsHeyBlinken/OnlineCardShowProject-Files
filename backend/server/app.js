const express = require('express');
const app = express();
const webhookRoutes = require('./routes/webhooks');

// Important: Webhooks must be registered before the express.json() middleware
app.use('/api/webhooks', webhookRoutes);

// Regular JSON parsing for other routes
app.use(express.json());

// ... rest of your app configuration 