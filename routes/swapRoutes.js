const express = require('express');
const router = express.Router();
const { executeSwap, getSwapStatus } = require('../controller/swapController');

// Execute cross-chain swap using LiFi
router.post('/execute', executeSwap);

// Get swap transaction status
router.get('/status/:txHash', getSwapStatus);

module.exports = router;
