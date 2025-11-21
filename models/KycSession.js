const mongoose = require("mongoose");

const kycSessionSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registeruser',
        required: true,
    },
    session_id: {
        type: String,
        required: true,
        unique: true,
    },
    workflow_id: {
        type: String,
        required: true,
    },
    verification_url: {
        type: String,
        required: true,
    },
    vendor_data: {
        type: String,
        required: true,
    },
    callback_url: {
        type: String,
        default: null,
    },
    session_details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    verification_result: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    expires_at: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        }
    }
});

// Update the updated_at field before saving
kycSessionSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

// Index for faster queries
kycSessionSchema.index({ user_id: 1 });
kycSessionSchema.index({ session_id: 1 });
kycSessionSchema.index({ status: 1 });

const KycSessionModel = mongoose.model("KycSession", kycSessionSchema);

module.exports = { KycSessionModel };