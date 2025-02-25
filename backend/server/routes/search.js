const express = require('express');
const router = express.Router();
const pool = require('../db'); // Import the pool from db.js

// Mock search handler
router.get('/search', async (req, res) => {
  const { 
    query,
    page = 1,
    sort = 'newest',
    condition,
    minPrice,
    maxPrice,
    category
  } = req.query;
  
  const itemsPerPage = 12;
  const offset = (page - 1) * itemsPerPage;
  
  try {
    let queryString = `
      SELECT 
        l.*,
        u.username as seller_name,
        COUNT(*) OVER() as total_count
      FROM listings l
      JOIN users u ON l.seller_id = u.id
      WHERE l.active = true
    `;
    
    const queryParams = [];
    let paramCount = 1;

    // Add search query
    if (query) {
      queryString += ` AND (
        l.title ILIKE $${paramCount}
        OR l.description ILIKE $${paramCount}
        OR u.username ILIKE $${paramCount}
      )`;
      queryParams.push(`%${query}%`);
      paramCount++;
    }

    // Add filters
    if (condition) {
      queryString += ` AND l.condition = $${paramCount}`;
      queryParams.push(condition);
      paramCount++;
    }

    if (minPrice) {
      queryString += ` AND l.price >= $${paramCount}`;
      queryParams.push(minPrice);
      paramCount++;
    }

    if (maxPrice) {
      queryString += ` AND l.price <= $${paramCount}`;
      queryParams.push(maxPrice);
      paramCount++;
    }

    if (category) {
      queryString += ` AND l.category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }

    // Add sorting
    queryString += ` ORDER BY `;
    switch (sort) {
      case 'price-low':
        queryString += 'l.price ASC';
        break;
      case 'price-high':
        queryString += 'l.price DESC';
        break;
      case 'best-match':
        if (query) {
          queryString += `
            CASE 
              WHEN l.title ILIKE $${paramCount} THEN 1
              WHEN l.description ILIKE $${paramCount} THEN 2
              ELSE 3
            END,
            l.created_at DESC
          `;
          queryParams.push(`%${query}%`);
          paramCount++;
        } else {
          queryString += 'l.created_at DESC';
        }
        break;
      default: // newest
        queryString += 'l.created_at DESC';
    }

    queryString += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(itemsPerPage, offset);

    const result = await pool.query(queryString, queryParams);
    
    const total = result.rows[0]?.total_count || 0;

    res.json({
      results: result.rows,
      total,
      totalPages: Math.ceil(total / itemsPerPage),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 