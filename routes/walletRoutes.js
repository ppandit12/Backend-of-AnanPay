const express = require('express');
const { getWallet } = require('../controller/getWalletController');

const router = express.Router();

// GET wallet by user ID
router.get('/getwallet', getWallet);

module.exports = router;
