const mongoose = require("mongoose");

const registeruserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: Number,
        required: true,
        unique: true,
    },
    pin: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'user','business'],
        required: true,
    },
    isKycApproved: {
        type: Boolean,
        default: false,
    },
    isEmailVerified: {
        type: Boolean,
        default: false, // New field to track email verification
    },
    pinResetOtp: {
        type: String,
    },
    pinResetOtpExpires: {
        type: Date,
    },
    wallets: {
        type: Map,
        of: {
            address: String,
            encryptedPrivateKey: String,
            iv: String,
            authTag: String,
            salt: String,
            publicKey: String,
        },
    },
    mnemonic: {
        encryptedMnemonic: String,
        iv: String,
        authTag: String,
        salt: String,
    },
}, {
    timestamps: true,
});

const RegisteruserModel = mongoose.model("registeruser", registeruserSchema);
module.exports = { RegisteruserModel };