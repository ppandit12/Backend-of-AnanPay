const express = require('express');
const router = express.Router();
const transactionController = require('../controller/sendTransaction');

// =============================================================================
// EVM CHAIN ROUTES
// =============================================================================

// Ethereum Transaction
router.post('/send-ethereum', transactionController.sendEthereum);

// BNB Chain Transaction
router.post('/send-bnb', transactionController.sendBNB);

// Avalanche Transaction
router.post('/send-avalanche', transactionController.sendAvalanche);

// Optimism Transaction
router.post('/send-optimism', transactionController.sendOptimism);

// Arbitrum Transaction
router.post('/send-arbitrum', transactionController.sendArbitrum);

// =============================================================================
// ERC-20 TOKEN ROUTES
// =============================================================================

// Chainlink (LINK) Token Transaction
router.post('/send-chainlink', transactionController.sendChainlink);

// AAVE Token Transaction
router.post('/send-aave', transactionController.sendAAVE);

// UNI Token Transaction
router.post('/send-uni', transactionController.sendUNI);

// =============================================================================
// MULTI-CHAIN STABLECOIN ROUTES
// =============================================================================

// USDT Transactions (Multi-chain: Ethereum, BNB, Avalanche, Optimism, Arbitrum, TRON)
router.post('/send-usdt-ethereum', transactionController.sendUSDT);
router.post('/send-usdt-bnb', transactionController.sendUSDT);
router.post('/send-usdt-avalanche', transactionController.sendUSDT);
router.post('/send-usdt-optimism', transactionController.sendUSDT);
router.post('/send-usdt-arbitrum', transactionController.sendUSDT);
router.post('/send-usdt-tron', transactionController.sendUSDT);

// USDC Transactions (Multi-chain: Ethereum, BNB, Avalanche, Optimism, Arbitrum, TRON)
router.post('/send-usdc-ethereum', transactionController.sendUSDC);
router.post('/send-usdc-bnb', transactionController.sendUSDC);
router.post('/send-usdc-avalanche', transactionController.sendUSDC);
router.post('/send-usdc-optimism', transactionController.sendUSDC);
router.post('/send-usdc-arbitrum', transactionController.sendUSDC);
router.post('/send-usdc-tron', transactionController.sendUSDC);

// Generic USDT/USDC routes (network specified in request body)
router.post('/send-usdt', transactionController.sendUSDT);
router.post('/send-usdc', transactionController.sendUSDC);

// =============================================================================
// NON-EVM CHAIN ROUTES
// =============================================================================

// Bitcoin Transaction
router.post('/send-bitcoin', transactionController.sendBitcoin);

// Litecoin Transaction
router.post('/send-litecoin', transactionController.sendLitecoin);

// Solana Transaction
router.post('/send-solana', transactionController.sendSolana);

// Solana Token Transactions
router.post('/send-usdt-solana', (req, res) => {
    // Add network to request body for Solana USDT
    req.body.network = 'solana';
    transactionController.sendUSDT(req, res);
});

router.post('/send-usdc-solana', (req, res) => {
    // Add network to request body for Solana USDC
    req.body.network = 'solana';
    transactionController.sendUSDC(req, res);
});

// XRP Transaction
router.post('/send-xrp', transactionController.sendXRP);

// TRON Transaction
router.post('/send-tron', transactionController.sendTron);

// Cardano Transaction
router.post('/send-cardano', transactionController.sendCardano);

// SUI Transaction
router.post('/send-sui', transactionController.sendSUI);

// =============================================================================
// UTILITY ROUTES
// =============================================================================

// Route to get supported networks for a specific token
router.get('/supported-networks/:token', (req, res) => {
    const { token } = req.params;
    
    const supportedNetworks = {
        ethereum: ['ethereum'],
        bnb: ['bnb'],
        avalanche: ['avalanche'],
        optimism: ['optimism'],
        arbitrum: ['arbitrum'],
        chainlink: ['ethereum'],
        aave: ['ethereum'],
        uni: ['ethereum'],
        usdt: ['ethereum', 'bnb', 'avalanche', 'optimism', 'arbitrum', 'tron', 'solana'],
        usdc: ['ethereum', 'bnb', 'avalanche', 'optimism', 'arbitrum', 'tron', 'solana'],
        bitcoin: ['bitcoin'],
        litecoin: ['litecoin'],
        solana: ['solana'],
        xrp: ['xrp'],
        tron: ['tron'],
        cardano: ['cardano'],
        sui: ['sui']
    };
    
    const networks = supportedNetworks[token.toLowerCase()];
    
    if (networks) {
        res.status(200).json({
            token: token,
            supportedNetworks: networks
        });
    } else {
        res.status(404).json({
            error: 'Token not supported',
            supportedTokens: Object.keys(supportedNetworks)
        });
    }
});

// Route to get all available transaction endpoints
router.get('/endpoints', (req, res) => {
    const endpoints = {
        nativeTokens: {
            ethereum: '/api/transactions/send-ethereum',
            bnb: '/api/transactions/send-bnb',
            avalanche: '/api/transactions/send-avalanche',
            optimism: '/api/transactions/send-optimism',
            arbitrum: '/api/transactions/send-arbitrum',
            bitcoin: '/api/transactions/send-bitcoin',
            litecoin: '/api/transactions/send-litecoin',
            solana: '/api/transactions/send-solana',
            xrp: '/api/transactions/send-xrp',
            tron: '/api/transactions/send-tron',
            cardano: '/api/transactions/send-cardano',
            sui: '/api/transactions/send-sui'
        },
        erc20Tokens: {
            chainlink: '/api/transactions/send-chainlink',
            aave: '/api/transactions/send-aave',
            uni: '/api/transactions/send-uni'
        },
        stablecoins: {
            usdt: {
                ethereum: '/api/transactions/send-usdt-ethereum',
                bnb: '/api/transactions/send-usdt-bnb',
                avalanche: '/api/transactions/send-usdt-avalanche',
                optimism: '/api/transactions/send-usdt-optimism',
                arbitrum: '/api/transactions/send-usdt-arbitrum',
                tron: '/api/transactions/send-usdt-tron',
                solana: '/api/transactions/send-usdt-solana',
                generic: '/api/transactions/send-usdt'
            },
            usdc: {
                ethereum: '/api/transactions/send-usdc-ethereum',
                bnb: '/api/transactions/send-usdc-bnb',
                avalanche: '/api/transactions/send-usdc-avalanche',
                optimism: '/api/transactions/send-usdc-optimism',
                arbitrum: '/api/transactions/send-usdc-arbitrum',
                tron: '/api/transactions/send-usdc-tron',
                solana: '/api/transactions/send-usdc-solana',
                generic: '/api/transactions/send-usdc'
            }
        },
        utilities: {
            supportedNetworks: '/api/transactions/supported-networks/:token',
            endpoints: '/api/transactions/endpoints'
        }
    };
    
    res.status(200).json(endpoints);
});

// =============================================================================
// MIDDLEWARE FOR REQUEST VALIDATION
// =============================================================================


module.exports = router;