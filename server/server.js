// ... existing imports and middleware ...

// Import routes
const authRoutes = require('./routes/api/auth');
const userRoutes = require('./routes/api/users');
const cardRoutes = require('./routes/api/cards');
const collectionRoutes = require('./routes/api/collections');
const reportIssueRoutes = require('./routes/api/report-issue');
const supportTicketsRoutes = require('./routes/api/support-tickets');
// ... other route imports ...

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/report-issue', reportIssueRoutes);
app.use('/api/support-tickets', supportTicketsRoutes);
// ... other route registrations ...

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); 