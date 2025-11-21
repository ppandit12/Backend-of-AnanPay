const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    // User Reference
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registeruser',
        required: false
    },
    
    // Basic Transaction Details
    txHash: {
        type: String,
        required: true,
        unique: true
    },
    fromAddress: {
        type: String,
        required: true
    },
    toAddress: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: true
    },
    marketprice: {
        type: String,
        required: false
    },
    
    // Network & Crypto Info
    cryptocurrency: {
        type: String,
        required: true
    },
    network: {
        type: String,
        required: true
    },
    
    // Transaction Status
    status: {
        type: String,
        required: true,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    
    // Optional Blockchain Details
    blockNumber: {
        type: Number,
        required: false
    },
    gasUsed: {
        type: String,
        required: false
    },
    
    // Error Information
    errorMessage: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
