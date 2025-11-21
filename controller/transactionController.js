const TransactionModel = require('../models/Transaction');

// Get all transactions by user_id
exports.getTransactionsByUserId = async (req, res) => {
    try {
        const { user_id } = req.body;

        // Validate user_id is provided
        if (!user_id) {
            return res.status(400).json({ 
                error: 'Missing required field: user_id' 
            });
        }

        // Validate if user_id is a valid ObjectId
        if (!require('mongoose').Types.ObjectId.isValid(user_id)) {
            return res.status(200).json({ 
                message: 'No transactions found for this user',
                transactions: [],
                count: 0,
                summary: {
                    total: 0,
                    success: 0,
                    failed: 0,
                    pending: 0
                }
            });
        }

        // Find all transactions for the user and populate user details
        const transactions = await TransactionModel.find({ user_id })
            .populate('user_id', 'name email phone') // Populate user details (name, email, phone)
            .sort({ createdAt: -1 }); // Sort by newest first

        // Return transactions with summary (even if empty)
        res.status(200).json({
            message: transactions.length > 0 ? 'Transactions retrieved successfully' : 'No transactions found for this user',
            transactions,
            count: transactions.length,
            summary: {
                total: transactions.length,
                success: transactions.filter(tx => tx.status === 'success').length,
                failed: transactions.filter(tx => tx.status === 'failed').length,
                pending: transactions.filter(tx => tx.status === 'pending').length
            }
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ 
            error: 'Server error while fetching transactions',
            details: error.message 
        });
    }
};

// Get transaction statistics by user_id
exports.getTransactionStats = async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ 
                error: 'Missing required field: user_id' 
            });
        }

        // Aggregate transaction statistics
        const stats = await TransactionModel.aggregate([
            { $match: { user_id: require('mongoose').Types.ObjectId(user_id) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: { $toDouble: '$amount' } }
                }
            }
        ]);

        // Get cryptocurrency breakdown
        const cryptoStats = await TransactionModel.aggregate([
            { $match: { user_id: require('mongoose').Types.ObjectId(user_id) } },
            {
                $group: {
                    _id: '$cryptocurrency',
                    count: { $sum: 1 },
                    totalAmount: { $sum: { $toDouble: '$amount' } }
                }
            }
        ]);

        res.status(200).json({
            message: 'Transaction statistics retrieved successfully',
            statusStats: stats,
            cryptoStats: cryptoStats
        });

    } catch (error) {
        console.error('Error fetching transaction stats:', error);
        res.status(500).json({ 
            error: 'Server error while fetching transaction statistics',
            details: error.message 
        });
    }
};

// Get recent transactions by user_id (last 10)
exports.getRecentTransactions = async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ 
                error: 'Missing required field: user_id' 
            });
        }

        const recentTransactions = await TransactionModel.find({ user_id })
            .populate('user_id', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            message: 'Recent transactions retrieved successfully',
            transactions: recentTransactions,
            count: recentTransactions.length
        });

    } catch (error) {
        console.error('Error fetching recent transactions:', error);
        res.status(500).json({ 
            error: 'Server error while fetching recent transactions',
            details: error.message 
        });
    }
};
