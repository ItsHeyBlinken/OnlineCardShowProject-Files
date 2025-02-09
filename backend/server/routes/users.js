const express = require('express');
const router = express.Router();
const { getUser, createUser, updateUser, deleteUser, updateUserPreferences } = require('../controllers/userController');

// Route to get a user by ID
router.get('/:id', getUser);

// Route to create a new user
router.post('/', createUser);

// Route to update a user by ID
router.put('/:id', updateUser);

// Route to delete a user by ID
router.delete('/:id', deleteUser);

// Route to update user preferences
router.put('/:id/preferences', updateUserPreferences);

module.exports = router;
