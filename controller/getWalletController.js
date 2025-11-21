const { RegisteruserModel } = require('../models/RegisterUser');

const getWallet = async (req, res) => {
    try {
        const { _id } = req.body;

        // Check if _id is provided
        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        // Find user by _id
        const user = await RegisteruserModel.findById(_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Return wallets object
        res.status(200).json({
            success: true,
            message: "Wallets retrieved successfully",
            data: {
                wallets: user.wallets
            }
        });

    } catch (error) {
        console.error("Error in getWallet:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

module.exports = { getWallet };
