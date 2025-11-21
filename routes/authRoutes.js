const express = require('express');
const router = express.Router();
const userController = require('../controller/authController');

// Register route
router.post('/register', userController.register);

// Register route
router.post('/decrypt', userController.Decrypt);

// Verify OTP route
router.post('/verify-otp', userController.verifyOtp);

// Login route
router.post('/login', userController.login);

// Resend OTP route for PIN reset
router.post('/resend-otp', userController.resendOtp);

// Reset PIN route
router.post('/reset-pin', userController.resetPin);

// Get all users route
router.get('/all-users', userController.getAllUsers);

module.exports = router;