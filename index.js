
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const express = require("express");
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require("bcrypt");
const cors = require("cors");
const { connect } = require("./db/db");
const authRoutes = require('./routes/authRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const sendTransactionRoutes = require('./routes/sendTransactionRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const swapRoutes = require('./routes/swapRoutes');
const kycRoutes = require('./routes/kycRoutes');
const server = express();
server.use(express.json());
server.use(cors({
    origin: '*', // Allows all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allows specific methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allows specific headers
}));



//welcome message
server.get("/", (req, res) => {
    res.send("welcome to Anan Pay");
});



// Routes

//register user+ login+ wallet management
server.use('/api/auth', authRoutes);
//get user balance
server.use('/api/balance', balanceRoutes);

//send transaction routes
server.use('/api/transaction', sendTransactionRoutes);

//get transaction history and stats
server.use('/api/transactions', transactionRoutes);

//wallet routes
server.use('/api', walletRoutes);

//cross-chain swap routes (LiFi integration)
server.use('/api/swap', swapRoutes);

//KYC verification routes (Didit integration)
server.use('/api/kyc', kycRoutes);

// Crypto prices endpoint
const CMC_API_KEY = 'da9cd381261645b7a9936a1acf3c893e';

server.get('/api/crypto/prices', async (req, res) => {
  try {
    const symbols = 'BTC,ETH,BNB,SOL,AVAX,LTC,XRP,TRX,ADA,XLM';
    
    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USD`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': CMC_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    const data = await response.json();
    
    const prices = {};
    if (data.data) {
      Object.keys(data.data).forEach(symbol => {
        prices[symbol] = data.data[symbol].quote.USD.price;
      });
    }
    
    res.json({ success: true, prices });
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

connect.then(() => console.log("MongoDB connected")).catch(err => console.error("MongoDB connection error:", err));

server.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});

// Export for Vercel serverless
module.exports = server;