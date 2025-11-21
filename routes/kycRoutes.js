const express = require('express');
const router = express.Router();
const kycController = require('../controller/kycController');

// Create verification session
router.post('/create-session', kycController.createVerificationSession);

// Get verification session status by user_id
router.get('/status/:user_id', kycController.getVerificationStatus);

// Generate and download PDF report by user_id
router.get('/pdf/:user_id', kycController.generateSessionPDF);

// Get all KYC sessions
router.get('/all-sessions', kycController.getAllKycSessions);

module.exports = router;