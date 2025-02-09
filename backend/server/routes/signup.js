const express = require('express');
const router = express.Router();
const { signUpUser } = require('../controllers/userController');

// Route to handle user sign-up
router.post('/signup', signUpUser);

module.exports = router;
