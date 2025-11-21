const { KycSessionModel } = require('../models/KycSession');
const { RegisteruserModel } = require('../models/RegisterUser');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('node:fs');
const path = require('node:path');

// Didit API configuration
const DIDIT_API_KEY = 'uVTyIRXlKuvWK0MvJL_97wG8_y0qR2OnvcJZ45-fZU0';
const WORKFLOW_ID = '6a4fba7d-e3d3-414a-b4ab-cec032741426';
const DIDIT_BASE_URL = 'https://verification.didit.me/v2';
const DIDIT_PDF_BASE_URL = 'https://verification.didit.me/v1'; // v1 for PDF generation

/**
 * Create a new verification session with Didit
 */
const createVerificationSession = async (req, res) => {
    try {
        const { user_id, callback_url } = req.body;

        // Validate required fields
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        // Check if user exists
        const user = await RegisteruserModel.findById(user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate unique vendor_data (using user_id + timestamp)
        const vendor_data = `${user_id}_${Date.now()}`;

        // Prepare request payload for Didit API
        const sessionPayload = {
            workflow_id: WORKFLOW_ID,
            vendor_data: vendor_data,
            callback: callback_url || null
        };

        // Call Didit Create Session API
        const diditResponse = await axios.post(
            `${DIDIT_BASE_URL}/session/`,
            sessionPayload,
            {
                headers: {
                    'x-api-key': DIDIT_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (diditResponse.status !== 201) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create verification session with Didit'
            });
        }

        const sessionData = diditResponse.data;

        // Check if user already has any session, if so, replace it with new session
        let kycSession = await KycSessionModel.findOne({ user_id: user_id });

        if (kycSession) {
            // Update existing session with new data (replace previous session)
            kycSession.session_id = sessionData.sessionId || sessionData.session_id;
            kycSession.workflow_id = WORKFLOW_ID;
            kycSession.verification_url = sessionData.url || sessionData.verification_url;
            kycSession.vendor_data = vendor_data;
            kycSession.callback_url = callback_url || null;
            kycSession.session_details = sessionData;
            kycSession.verification_result = null; // Reset previous results
            kycSession.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // Reset expiration
            kycSession.updated_at = Date.now();
            await kycSession.save();
        } else {
            // Create new session record
            kycSession = new KycSessionModel({
                user_id: user_id,
                session_id: sessionData.sessionId || sessionData.session_id,
                workflow_id: WORKFLOW_ID,
                verification_url: sessionData.url || sessionData.verification_url,
                vendor_data: vendor_data,
                callback_url: callback_url || null,
                session_details: sessionData
            });
            await kycSession.save();
        }

        res.status(201).json({
            success: true,
            message: 'Verification session created successfully',
            data: {
                session_id: kycSession.session_id,
                verification_url: kycSession.verification_url,
                workflow_id: WORKFLOW_ID,
                expires_at: kycSession.expires_at
            }
        });

    } catch (error) {
        console.error('Error creating verification session:', error);
        
        if (error.response && error.response.data) {
            return res.status(error.response.status || 500).json({
                success: false,
                message: 'Didit API error',
                error: error.response.data
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get verification session status by user_id
 */
const getVerificationStatus = async (req, res) => {
    try {
        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        // Find session in database by user_id
        const kycSession = await KycSessionModel.findOne({ user_id: user_id })
            .populate('user_id', 'name email phone isKycApproved');

        if (!kycSession) {
            return res.status(404).json({
                success: false,
                message: 'No KYC session found for this user'
            });
        }

        // Call Didit Retrieve Session API to get latest status
        try {
            const diditResponse = await axios.get(
                `${DIDIT_BASE_URL}/session/${kycSession.session_id}/decision/`,
                {
                    headers: {
                        'x-api-key': DIDIT_API_KEY
                    }
                }
            );

            const verificationResult = diditResponse.data;

            // Update session with latest data from Didit (keep original status from Didit)
            kycSession.verification_result = verificationResult;
            kycSession.updated_at = Date.now();
            await kycSession.save();

            // If verification is approved, update user's KYC status
            if (verificationResult.status === 'Approved') {
                await RegisteruserModel.findByIdAndUpdate(
                    kycSession.user_id._id,
                    { isKycApproved: true },
                    { new: true }
                );
            }

            res.status(200).json({
                success: true,
                data: {
                    session_id: kycSession.session_id,
                    user_id: kycSession.user_id._id,
                    user_info: {
                        name: kycSession.user_id.name,
                        email: kycSession.user_id.email,
                        phone: kycSession.user_id.phone,
                        isKycApproved: kycSession.user_id.isKycApproved
                    },
                    workflow_id: kycSession.workflow_id,
                    verification_url: kycSession.verification_url,
                    verification_result: kycSession.verification_result,
                    created_at: kycSession.created_at,
                    updated_at: kycSession.updated_at,
                    expires_at: kycSession.expires_at
                }
            });

        } catch (diditError) {
            // If Didit API call fails, return current database status
            console.error('Error calling Didit API:', diditError);
            
            res.status(200).json({
                success: true,
                message: 'Session found (Didit API unavailable)',
                data: {
                    session_id: kycSession.session_id,
                    user_id: kycSession.user_id._id,
                    user_info: {
                        name: kycSession.user_id.name,
                        email: kycSession.user_id.email,
                        phone: kycSession.user_id.phone,
                        isKycApproved: kycSession.user_id.isKycApproved
                    },
                    workflow_id: kycSession.workflow_id,
                    verification_url: kycSession.verification_url,
                    verification_result: kycSession.verification_result,
                    created_at: kycSession.created_at,
                    updated_at: kycSession.updated_at,
                    expires_at: kycSession.expires_at
                }
            });
        }

    } catch (error) {
        console.error('Error getting verification status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Generate and download PDF report for user's KYC session
 */
const generateSessionPDF = async (req, res) => {
    try {
        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        // Find session in database by user_id
        const kycSession = await KycSessionModel.findOne({ user_id: user_id })
            .populate('user_id', 'name email phone');

        if (!kycSession) {
            return res.status(404).json({
                success: false,
                message: 'No KYC session found for this user'
            });
        }

        // Check if session has verification results
        if (!kycSession.verification_result) {
            return res.status(400).json({
                success: false,
                message: 'No verification results available. Please complete the verification first.'
            });
        }

        try {
            console.log('Requesting PDF from Didit...');
            
            // Call Didit PDF generation API
            const response = await axios.get(
                `${DIDIT_PDF_BASE_URL}/session/${kycSession.session_id}/generate-pdf`,
                {
                    headers: {
                        'accept': '*/*',
                        'x-api-key': DIDIT_API_KEY
                    },
                    responseType: 'arraybuffer' // Important for binary data
                }
            );

            if (response.status !== 200) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate PDF from Didit API',
                    error: `Status: ${response.status}`
                });
            }

            // Create PDF buffer
            const buffer = Buffer.from(response.data);
            
            // Generate filename with user info and timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `kyc-report-${kycSession.user_id.name.replace(/\s+/g, '_')}-${timestamp}.pdf`;

            // Set response headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);

            // Send PDF buffer as response
            res.send(buffer);

            console.log(`PDF generated successfully for user: ${kycSession.user_id.name}`);

        } catch (diditError) {
            console.error('Error calling Didit PDF API:', diditError);
            
            if (diditError.response) {
                return res.status(diditError.response.status || 500).json({
                    success: false,
                    message: 'Didit PDF API error',
                    error: diditError.response.data || diditError.message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to generate PDF',
                error: diditError.message
            });
        }

    } catch (error) {
        console.error('Error generating session PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get all KYC sessions
 */
const getAllKycSessions = async (req, res) => {
    try {
        const kycSessions = await KycSessionModel.find()
            .populate('user_id', 'name email phone isKycApproved')
            .sort({ created_at: -1 })
            .catch(err => {
                console.error('Database query error:', err);
                return [];
            });

        const validSessions = (kycSessions || [])
            .filter(session => session && session.user_id)
            .map(session => ({
                session_id: session.session_id,
                user_id: session.user_id._id,
                user_info: {
                    name: session.user_id.name,
                    email: session.user_id.email,
                    phone: session.user_id.phone,
                    isKycApproved: session.user_id.isKycApproved
                },
                workflow_id: session.workflow_id,
                verification_url: session.verification_url,
                verification_result: session.verification_result,
                created_at: session.created_at,
                updated_at: session.updated_at,
                expires_at: session.expires_at
            }));

        res.status(200).json({
            success: true,
            data: validSessions
        });
    } catch (error) {
        console.error('Error getting all KYC sessions:', error);
        // Return empty array instead of error to prevent frontend crashes
        res.status(200).json({
            success: true,
            data: [],
            message: 'No KYC sessions available'
        });
    }
};

module.exports = {
    createVerificationSession,
    getVerificationStatus,
    generateSessionPDF,
    getAllKycSessions
};