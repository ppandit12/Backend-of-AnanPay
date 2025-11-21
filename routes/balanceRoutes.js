const express = require('express');
const router = express.Router();
const userBalance = require('../controller/getAllBalances');

// Register route
router.post('/balance', userBalance.getAllBalances);



module.exports = router;