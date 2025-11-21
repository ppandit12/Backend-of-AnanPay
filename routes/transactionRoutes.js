const express = require('express');
const router = express.Router();
const transactionController = require('../controller/transactionController');

// Get all transactions by user_id
router.post('/user-transactions', transactionController.getTransactionsByUserId);

// Get transaction statistics by user_id
router.post('/user-stats', transactionController.getTransactionStats);

// Get recent transactions by user_id (last 10)
router.post('/recent-transactions', transactionController.getRecentTransactions);

module.exports = router;
