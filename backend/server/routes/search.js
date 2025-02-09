const express = require('express');
const router = express.Router();

// Mock search handler
router.get('/search', (req, res) => {
  const { query } = req.query;
  console.log('Received search query:', query); // Log the incoming query

  // Check if the query parameter is provided
  if (!query) {
    console.error('No query parameter provided'); // Log the error
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  // Implement search logic here
  // For now, return mock results
  const results = []; // This would be replaced with actual search logic

  if (results.length === 0) {
    console.log('No results found for query:', query); // Log if no results
  }

  res.json({ results });
});

module.exports = router; 