const { ethers } = require('ethers');
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const secp256k1 = require('@bitcoinerlab/secp256k1');
const { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, createTransferInstruction, getAssociatedTokenAddress } = require('@solana/spl-token');
const xrpl = require('xrpl');
const TronWeb = require('tronweb');
const { TransactionBuilder, Address, BigNum, LinearFee, BaseAddress, StakeCredential } = require('@emurgo/cardano-serialization-lib-nodejs');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { getFullnodeUrl, SuiClient } = require('@mysten/sui.js/client');
const axios = require('axios');
const { bech32 } = require('bech32');
const TransactionModel = require('../models/Transaction');
const ECPair = ECPairFactory(secp256k1.secp256k1 || secp256k1);

// Network configurations
const NETWORKS = {
    ethereum: {
        rpcUrl: process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/YXGkhE6xdFPn_cRUEwgKC', // Fix this API key
        chainId: 1
    },
    bnb: {
        rpcUrl: process.env.BNB_RPC || 'https://bsc-dataseed1.binance.org/',
        chainId: 56
    },
    avalanche: {
        rpcUrl: process.env.AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc',
        chainId: 43114
    },
    optimism: {
        rpcUrl: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io',
        chainId: 10
    },
    arbitrum: {
        rpcUrl: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
        chainId: 42161
    }
};

// Token contract addresses
const TOKEN_CONTRACTS = {
    chainlink: {
        ethereum: '0x514910771AF9Ca656af840dff83E8264EcF986CA'
    },
    aave: {
        ethereum: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
    },
    uni: {
        ethereum: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
    },
    usdt: {
        ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        bnb: '0x55d398326f99059ff775485246999027b3197955',
        avalanche: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
        optimism: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
        arbitrum: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        tron: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        solana: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' // USDT SPL mint
    },
    usdc: {
        ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
        bnb: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC on BSC
        avalanche: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC on Avalanche
        optimism: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
        arbitrum: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
        tron: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
        solana: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC SPL mint
    }
};

// Litecoin network configuration
const litecoinNetwork = {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'ltc',
    bip32: { public: 0x019da462, private: 0x019d9cfe },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0,
};

// =============================================================================
// TRANSACTION STORAGE HELPER
// =============================================================================

async function saveTransaction(txHash, fromAddress, toAddress, amount, cryptocurrency, network, status = 'pending', blockNumber = null, gasUsed = null, errorMessage = null, user_id = null, marketprice = null) {
    try {
        const transaction = new TransactionModel({
            user_id,
            txHash,
            fromAddress,
            toAddress,
            amount: amount.toString(),
            marketprice: marketprice ? marketprice.toString() : null,
            cryptocurrency,
            network,
            status,
            blockNumber,
            gasUsed,
            errorMessage
        });
        await transaction.save();
        return transaction;
    } catch (error) {
        console.error('Error saving transaction:', error);
    }
}

// =============================================================================
// EVM CHAIN CONTROLLERS
// =============================================================================

// Generic EVM transaction function
async function sendEVMTransaction(network, fromAddress, privateKey, toAddress, amount, tokenContract = null) {
    try {
        const provider = new ethers.JsonRpcProvider(NETWORKS[network].rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);

        // Verify sender address matches private key
        if (wallet.address.toLowerCase() !== fromAddress.toLowerCase()) {
            throw new Error('Private key does not match the provided address');
        }

        let tx;

        if (tokenContract) {
            // ERC-20 token transfer
            const tokenABI = [
                "function transfer(address to, uint256 amount) returns (bool)",
                "function decimals() view returns (uint8)"
            ];

            const contract = new ethers.Contract(tokenContract, tokenABI, wallet);
            const decimals = await contract.decimals();
            const tokenAmount = ethers.parseUnits(amount.toString(), decimals);

            tx = await contract.transfer(toAddress, tokenAmount);
        } else {
            // Native token transfer
            const value = ethers.parseEther(amount.toString());
            tx = await wallet.sendTransaction({
                to: toAddress,
                value: value
            });
        }

        const receipt = await tx.wait();

        return {
            success: true,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            network: network
        };
    } catch (error) {
        throw new Error(`${network.toUpperCase()} transaction failed: ${error.message}`);
    }
}

// =============================================================================
// SOLANA SPL TOKEN HELPER
// =============================================================================

async function sendSolanaToken(fromPrivateKey, toAddress, amount, mintAddress) {
    try {
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        
        // Create keypair from private key
        const privateKeyBytes = new Uint8Array(Buffer.from(fromPrivateKey, 'hex'));
        const fromKeypair = Keypair.fromSecretKey(privateKeyBytes);
        
        const fromPubkey = fromKeypair.publicKey;
        const toPubkey = new PublicKey(toAddress);
        const mintPubkey = new PublicKey(mintAddress);
        
        // Check SOL balance for transaction fees first
        const solBalance = await connection.getBalance(fromPubkey);
        if (solBalance < 10000) { // ~0.00001 SOL minimum for fees
            throw new Error(`Insufficient SOL for transaction fees. Balance: ${solBalance / LAMPORTS_PER_SOL} SOL`);
        }
        
        // Get or create associated token accounts
        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromKeypair,
            mintPubkey,
            fromPubkey
        );
        
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromKeypair,
            mintPubkey,
            toPubkey
        );
        
        // Convert amount to token units (6 decimals for USDT/USDC)
        const tokenAmount = Math.floor(parseFloat(amount) * 1000000);
        
        // Check token balance
        const tokenBalance = await connection.getTokenAccountBalance(fromTokenAccount.address);
        const currentBalance = parseInt(tokenBalance.value.amount);
        
        if (currentBalance < tokenAmount) {
            const readableBalance = currentBalance / 1000000; // Convert back to readable format
            throw new Error(`Insufficient token balance. Available: ${readableBalance}, Required: ${amount}`);
        }
        
        // Create transfer instruction
        const transferInstruction = createTransferInstruction(
            fromTokenAccount.address,
            toTokenAccount.address,
            fromPubkey,
            tokenAmount
        );
        
        // Create and send transaction
        const transaction = new Transaction().add(transferInstruction);
        const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
        
        return {
            success: true,
            txHash: signature,
            network: 'solana'
        };
    } catch (error) {
        throw new Error(`Solana SPL token transaction failed: ${error.message}`);
    }
}

// Ethereum Controller
exports.sendEthereum = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await sendEVMTransaction('ethereum', fromAddress, privateKey, toAddress, amount);
        
        // Store transaction in database
        if (result.success) {
            await saveTransaction(
                result.txHash,
                fromAddress,
                toAddress,
                amount,
                'ethereum', // hardcoded cryptocurrency
                'ethereum', // hardcoded network
                'success',
                result.blockNumber,
                result.gasUsed,
                null,
                user_id,
                marketprice
            );
        }
        
        res.status(200).json({ message: 'Ethereum transaction successful', ...result });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'ethereum',
                'ethereum',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};

// BNB Controller
exports.sendBNB = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await sendEVMTransaction('bnb', fromAddress, privateKey, toAddress, amount);
        
        // Store transaction in database
        if (result.success) {
            await saveTransaction(
                result.txHash,
                fromAddress,
                toAddress,
                amount,
                'bnb', // hardcoded cryptocurrency
                'bnb', // hardcoded network
                'success',
                result.blockNumber,
                result.gasUsed,
                null,
                user_id,
                marketprice
            );
        }
        
        res.status(200).json({ message: 'BNB transaction successful', ...result });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'bnb',
                'bnb',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};

// Avalanche Controller
exports.sendAvalanche = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await sendEVMTransaction('avalanche', fromAddress, privateKey, toAddress, amount);
        
        // Store transaction in database
        if (result.success) {
            await saveTransaction(
                result.txHash,
                fromAddress,
                toAddress,
                amount,
                'avalanche', // hardcoded cryptocurrency
                'avalanche', // hardcoded network
                'success',
                result.blockNumber,
                result.gasUsed,
                null,
                user_id,
                marketprice
            );
        }
        
        res.status(200).json({ message: 'AVAX transaction successful', ...result });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'avalanche',
                'avalanche',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};

// Optimism Controller
exports.sendOptimism = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await sendEVMTransaction('optimism', fromAddress, privateKey, toAddress, amount);
        
        // Store transaction in database
        if (result.success) {
            await saveTransaction(
                result.txHash,
                fromAddress,
                toAddress,
                amount,
                'optimism', // hardcoded cryptocurrency
                'optimism', // hardcoded network
                'success',
                result.blockNumber,
                result.gasUsed,
                null,
                user_id,
                marketprice
            );
        }
        
        res.status(200).json({ message: 'Optimism transaction successful', ...result });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'optimism',
                'optimism',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};

// Arbitrum Controller
exports.sendArbitrum = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await sendEVMTransaction('arbitrum', fromAddress, privateKey, toAddress, amount);
        
        // Store transaction in database
        if (result.success) {
            await saveTransaction(
                result.txHash,
                fromAddress,
                toAddress,
                amount,
                'arbitrum', // hardcoded cryptocurrency
                'arbitrum', // hardcoded network
                'success',
                result.blockNumber,
                result.gasUsed,
                null,
                user_id,
                marketprice
            );
        }
        
        res.status(200).json({ message: 'Arbitrum transaction successful', ...result });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'arbitrum',
                'arbitrum',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};

// =============================================================================
// ERC-20 TOKEN CONTROLLERS
// =============================================================================

// Chainlink (LINK) Controller
exports.sendChainlink = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, network = 'ethereum', user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const contractAddress = TOKEN_CONTRACTS.chainlink[network];
        if (!contractAddress) {
            return res.status(400).json({ error: `Chainlink not supported on ${network}` });
        }

        const result = await sendEVMTransaction(network, fromAddress, privateKey, toAddress, amount, contractAddress);
        
        // Store transaction in database
        if (result.success) {
            await saveTransaction(
                result.txHash,
                fromAddress,
                toAddress,
                amount,
                'chainlink', // hardcoded cryptocurrency
                network, // dynamic network
                'success',
                result.blockNumber,
                result.gasUsed,
                null,
                user_id,
                marketprice
            );
        }
        
        res.status(200).json({ message: 'Chainlink transaction successful', ...result });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'chainlink',
                req.body.network || 'ethereum',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};

// AAVE Controller
exports.sendAAVE = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, network = 'ethereum', user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const contractAddress = TOKEN_CONTRACTS.aave[network];
        if (!contractAddress) {
            return res.status(400).json({ error: `AAVE not supported on ${network}` });
        }

        const result = await sendEVMTransaction(network, fromAddress, privateKey, toAddress, amount, contractAddress);
        
        // Store transaction in database
        if (result.success) {
            await saveTransaction(
                result.txHash,
                fromAddress,
                toAddress,
                amount,
                'aave', // hardcoded cryptocurrency
                network, // dynamic network
                'success',
                result.blockNumber,
                result.gasUsed,
                null,
                user_id,
                marketprice
            );
        }
        
        res.status(200).json({ message: 'AAVE transaction successful', ...result });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'aave',
                req.body.network || 'ethereum',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};

// UNI Controller
exports.sendUNI = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, network = 'ethereum', user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const contractAddress = TOKEN_CONTRACTS.uni[network];
        if (!contractAddress) {
            return res.status(400).json({ error: `UNI not supported on ${network}` });
        }

        const result = await sendEVMTransaction(network, fromAddress, privateKey, toAddress, amount, contractAddress);
        
        // Store transaction in database
        if (result.success) {
            await saveTransaction(
                result.txHash,
                fromAddress,
                toAddress,
                amount,
                'uni', // hardcoded cryptocurrency
                network, // dynamic network
                'success',
                result.blockNumber,
                result.gasUsed,
                null,
                user_id,
                marketprice
            );
        }
        
        res.status(200).json({ message: 'UNI transaction successful', ...result });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'uni',
                req.body.network || 'ethereum',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};

// =============================================================================
// STABLECOIN CONTROLLERS (Multi-chain)
// =============================================================================

// USDT Controller
exports.sendUSDT = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, network, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount || !network) {
            return res.status(400).json({ error: 'Missing required fields including network' });
        }

        const contractAddress = TOKEN_CONTRACTS.usdt[network];
        if (!contractAddress) {
            return res.status(400).json({ error: `USDT not supported on ${network}` });
        }

        let result;
        if (network === 'tron') {
            result = await sendTronToken(fromAddress, privateKey, toAddress, amount, contractAddress);
        } else if (network === 'solana') {
            result = await sendSolanaToken(privateKey, toAddress, amount, contractAddress);
        } else {
            result = await sendEVMTransaction(network, fromAddress, privateKey, toAddress, amount, contractAddress);
        }

        // Store transaction in database
        if (result.success) {
            await saveTransaction(
                result.txHash,
                fromAddress,
                toAddress,
                amount,
                'usdt', // hardcoded cryptocurrency
                network, // dynamic network (ethereum, bnb, tron, etc.)
                'success',
                result.blockNumber,
                result.gasUsed,
                null,
                user_id,
                marketprice
            );
        }

        res.status(200).json({ message: `USDT transaction successful on ${network}`, ...result });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'usdt',
                req.body.network || 'ethereum',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};

// USDC Controller
exports.sendUSDC = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, network, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount || !network) {
            return res.status(400).json({ error: 'Missing required fields including network' });
        }

        const contractAddress = TOKEN_CONTRACTS.usdc[network];
        if (!contractAddress) {
            return res.status(400).json({ error: `USDC not supported on ${network}` });
        }

        let result;
        if (network === 'tron') {
            result = await sendTronToken(fromAddress, privateKey, toAddress, amount, contractAddress);
        } else if (network === 'solana') {
            result = await sendSolanaToken(privateKey, toAddress, amount, contractAddress);
        } else {
            result = await sendEVMTransaction(network, fromAddress, privateKey, toAddress, amount, contractAddress);
        }

        // Store transaction in database
        if (result.success) {
            await saveTransaction(
                result.txHash,
                fromAddress,
                toAddress,
                amount,
                'usdc', // hardcoded cryptocurrency
                network, // dynamic network (ethereum, bnb, tron, etc.)
                'success',
                result.blockNumber,
                result.gasUsed,
                null,
                user_id,
                marketprice
            );
        }

        res.status(200).json({ message: `USDC transaction successful on ${network}`, ...result });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'usdc',
                req.body.network || 'unknown',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};

// =============================================================================
// NON-EVM CHAIN CONTROLLERS
// =============================================================================

// Bitcoin Controller
exports.sendBitcoin = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, feeRate = 10, user_id, marketprice } = req.body;

        // Validate input fields
        if (!fromAddress || !privateKey || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Parse amount and convert to satoshis
        const amountSatoshis = Math.round(parseFloat(amount) * 100000000);
        if (isNaN(amountSatoshis) || amountSatoshis <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const network = bitcoin.networks.bitcoin;
        const ECPair = ECPairFactory(secp256k1.secp256k1 || secp256k1);

        // Validate private key
        let keyPair;
        try {
            keyPair = ECPair.fromWIF(privateKey, network);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid private key: ' + e.message });
        }

        // Verify private key matches fromAddress
        const publicKeyBuffer = Buffer.from(keyPair.publicKey); // Convert Uint8Array to Buffer
        const { address } = bitcoin.payments.p2wpkh({ pubkey: publicKeyBuffer, network });
        if (address !== fromAddress) {
            return res.status(400).json({ error: 'Private key does not match fromAddress' });
        }

        // Create PSBT
        const psbt = new bitcoin.Psbt({ network });

        // Fetch UTXOs from Blockstream API
        let utxos;
        try {
            const response = await axios.get(`https://blockstream.info/api/address/${fromAddress}/utxo`);
            utxos = response.data;
        } catch (e) {
            return res.status(500).json({ error: 'Failed to fetch UTXOs: ' + e.message });
        }

        if (!utxos.length) {
            return res.status(400).json({ error: 'No UTXOs available. Insufficient balance.' });
        }

        console.log(`Found ${utxos.length} UTXOs for Bitcoin address ${fromAddress}`);

        // Add inputs
        let totalInput = 0;
        for (const utxo of utxos) {
            totalInput += utxo.value;
            console.log(`Bitcoin UTXO: ${utxo.txid}:${utxo.vout} = ${utxo.value} satoshis`);
            psbt.addInput({
                hash: utxo.txid,
                index: utxo.vout,
                witnessUtxo: {
                    script: bitcoin.address.toOutputScript(fromAddress, network),
                    value: utxo.value,
                },
            });
        }

        console.log(`Total Bitcoin input: ${totalInput} satoshis (${totalInput / 100000000} BTC)`);
        console.log(`Amount to send: ${amountSatoshis} satoshis (${amount} BTC)`);

        // Improved fee estimation
        const inputCount = utxos.length;
        const outputCount = 2; // recipient + change (or 1 if no change)
        const estimatedTxSize = inputCount * 148 + outputCount * 34 + 10;
        const fee = Math.ceil(estimatedTxSize * feeRate);
        
        console.log(`Estimated Bitcoin fee: ${fee} satoshis`);
        console.log(`Required total: ${amountSatoshis + fee} satoshis`);

        // Check if sufficient balance
        if (totalInput < amountSatoshis + fee) {
            return res.status(400).json({ 
                error: `Insufficient balance. Available: ${totalInput / 100000000} BTC, Required: ${(amountSatoshis + fee) / 100000000} BTC`,
                details: {
                    available: totalInput,
                    required: amountSatoshis + fee,
                    fee: fee
                }
            });
        }

        // Add output for recipient
        psbt.addOutput({
            address: toAddress,
            value: amountSatoshis,
        });

        // Add change output if applicable
        const change = totalInput - amountSatoshis - fee;
        if (change > 0) {
            psbt.addOutput({
                address: fromAddress,
                value: change,
            });
        }

        // Sign each input individually with proper Buffer conversion
        for (let i = 0; i < utxos.length; i++) {
            try {
                // Create a custom signer that ensures both pubkey and signature are Buffers
                const customSigner = {
                    publicKey: Buffer.from(keyPair.publicKey), // Convert publicKey to Buffer
                    sign: (hash) => {
                        const signature = keyPair.sign(hash);
                        return Buffer.from(signature); // Convert signature to Buffer
                    }
                };
                
                psbt.signInput(i, customSigner);
            } catch (signError) {
                console.error(`Failed to sign Bitcoin input ${i}:`, signError);
                throw new Error(`Failed to sign input ${i}: ${signError.message}`);
            }
        }

        // Validate all signatures with custom validator
        const customValidator = (pubkey, msghash, signature) => {
            return keyPair.verify(msghash, signature);
        };
        
        if (!psbt.validateSignaturesOfAllInputs(customValidator)) {
            throw new Error('Invalid Bitcoin signatures detected');
        }

        psbt.finalizeAllInputs();
        const tx = psbt.extractTransaction();
        const txHex = tx.toHex();

        // Broadcast transaction
        let txId;
        try {
            const broadcastResponse = await axios.post('https://blockstream.info/api/tx', txHex);
            txId = broadcastResponse.data;
        } catch (e) {
            return res.status(500).json({ error: 'Failed to broadcast transaction: ' + e.message });
        }

        // Store transaction in database
        try {
            await saveTransaction(
                txId,
                fromAddress,
                toAddress,
                amount,
                'bitcoin', // hardcoded cryptocurrency
                'bitcoin', // hardcoded network
                'success',
                null,
                null,
                null,
                user_id,
                marketprice
            );
        } catch (dbError) {
            console.error('Failed to save Bitcoin transaction:', dbError);
        }

        return res.status(200).json({
            message: 'Bitcoin transaction successful',
            success: true,
            txId,
            amountSatoshis,
            fee,
            change,
            network: 'bitcoin'
        });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'bitcoin',
                'bitcoin',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
};

// Litecoin Controller
exports.sendLitecoin = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, feeRate = 10, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const keyPair = ECPair.fromWIF(privateKey, litecoinNetwork);
        const amountSatoshis = Math.round(parseFloat(amount) * 1e8);

        // Verify private key matches fromAddress
        const publicKeyBuffer = Buffer.from(keyPair.publicKey);
        const { address } = bitcoin.payments.p2wpkh({ pubkey: publicKeyBuffer, network: litecoinNetwork });
        if (address !== fromAddress) {
            return res.status(400).json({ error: 'Private key does not match fromAddress' });
        }

        // Step 1: Fetch UTXOs
        const utxoUrl = `https://api.blockcypher.com/v1/ltc/main/addrs/${fromAddress}?unspentOnly=true`;
        const utxoResponse = await axios.get(utxoUrl);
        const utxos = utxoResponse.data.txrefs || [];

        if (!utxos || utxos.length === 0) {
            return res.status(400).json({ error: 'No UTXOs found. Possibly 0 balance.' });
        }

        console.log(`Found ${utxos.length} UTXOs for address ${fromAddress}`);

        // Step 2: Calculate total balance
        let inputTotal = 0;
        for (const utxo of utxos) {
            inputTotal += utxo.value; // BlockCypher returns values in satoshis
            console.log(`UTXO: ${utxo.tx_hash}:${utxo.tx_output_n} = ${utxo.value} satoshis`);
        }

        console.log(`Total input: ${inputTotal} satoshis (${inputTotal / 1e8} LTC)`);
        console.log(`Amount to send: ${amountSatoshis} satoshis (${amount} LTC)`);

        // Step 3: Estimate fee (basic estimate)
        const estimatedTxSize = utxos.length * 148 + 2 * 34 + 10;
        const estimatedFee = estimatedTxSize * feeRate;

        console.log(`Estimated fee: ${estimatedFee} satoshis`);
        console.log(`Required total: ${amountSatoshis + estimatedFee} satoshis`);

        if (inputTotal < amountSatoshis + estimatedFee) {
            return res.status(400).json({
                error: 'Insufficient funds',
                balance: inputTotal,
                required: amountSatoshis + estimatedFee,
                fee: estimatedFee,
            });
        }

        // Step 4: Build transaction using bitcoinjs-lib
        const psbt = new bitcoin.Psbt({ network: litecoinNetwork });

        // Add inputs
        for (const utxo of utxos) {
            psbt.addInput({
                hash: utxo.tx_hash,
                index: utxo.tx_output_n,
                witnessUtxo: {
                    script: bitcoin.address.toOutputScript(fromAddress, litecoinNetwork),
                    value: utxo.value,
                }
            });
        }

        // Add output for recipient
        psbt.addOutput({
            address: toAddress,
            value: amountSatoshis,
        });

        // Add change output if necessary
        const change = inputTotal - amountSatoshis - estimatedFee;
        if (change > 0) {
            psbt.addOutput({
                address: fromAddress,
                value: change,
            });
        }

        // Sign each input individually with proper Buffer conversion
        for (let i = 0; i < utxos.length; i++) {
            try {
                // Create a custom signer that ensures both pubkey and signature are Buffers
                const customSigner = {
                    publicKey: Buffer.from(keyPair.publicKey), // Convert publicKey to Buffer
                    sign: (hash) => {
                        const signature = keyPair.sign(hash);
                        return Buffer.from(signature); // Convert signature to Buffer
                    }
                };
                
                psbt.signInput(i, customSigner);
            } catch (signError) {
                console.error(`Failed to sign input ${i}:`, signError);
                throw new Error(`Failed to sign input ${i}: ${signError.message}`);
            }
        }

        // Validate all signatures with custom validator
        const customValidator = (pubkey, msghash, signature) => {
            return keyPair.verify(msghash, signature);
        };
        
        if (!psbt.validateSignaturesOfAllInputs(customValidator)) {
            throw new Error('Invalid signatures detected');
        }

        psbt.finalizeAllInputs();
        const tx = psbt.extractTransaction();
        const txHex = tx.toHex();

        // Step 5: Broadcast transaction
        const broadcastResponse = await axios.post('https://api.blockcypher.com/v1/ltc/main/txs/push', {
            tx: txHex
        });

        const txId = broadcastResponse.data.tx.hash;

        // Store successful transaction in database
        try {
            await saveTransaction(
                txId,
                fromAddress,
                toAddress,
                amount,
                'litecoin',
                'litecoin',
                'success',
                null,
                null,
                null,
                user_id,
                marketprice
            );
        } catch (dbError) {
            console.error('Failed to save Litecoin transaction:', dbError);
        }

        res.status(200).json({
            message: 'Litecoin transaction successful',
            success: true,
            txId: txId,
            amountSatoshis,
            fee: estimatedFee,
            change,
            network: 'litecoin'
        });

    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'litecoin',
                'litecoin',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        console.error(error?.response?.data || error);
        res.status(500).json({ error: error.message });
    }
};

// Solana Controller
exports.sendSolana = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            // Store failed transaction for missing fields
            try {
                await saveTransaction(
                    'failed_tx_' + Date.now(),
                    req.body.fromAddress || 'unknown',
                    req.body.toAddress || 'unknown',
                    req.body.amount || '0',
                    'solana',
                    'solana',
                    'failed',
                    null,
                    null,
                    'Missing required fields',
                    req.body.user_id,
                    req.body.marketprice
                );
            } catch (dbError) {
                console.error('Failed to save error transaction:', dbError);
            }
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const connection = new Connection(process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com');
        const privateKeyBytes = new Uint8Array(Buffer.from(privateKey, 'hex'));
        const fromKeypair = Keypair.fromSecretKey(privateKeyBytes);

        if (fromKeypair.publicKey.toBase58() !== fromAddress) {
            // Store failed transaction for address mismatch
            try {
                await saveTransaction(
                    'failed_tx_' + Date.now(),
                    fromAddress || 'unknown',
                    toAddress || 'unknown',
                    amount || '0',
                    'solana',
                    'solana',
                    'failed',
                    null,
                    null,
                    'Private key does not match the provided address',
                    user_id,
                    marketprice
                );
            } catch (dbError) {
                console.error('Failed to save error transaction:', dbError);
            }
            return res.status(400).json({ error: 'Private key does not match the provided address' });
        }

        const balance = await connection.getBalance(fromKeypair.publicKey);
        const lamports = Math.round(parseFloat(amount) * 1e9);

        if (balance < lamports) {
            // Store failed transaction for insufficient balance
            try {
                await saveTransaction(
                    'failed_tx_' + Date.now(),
                    fromAddress,
                    toAddress,
                    amount,
                    'solana',
                    'solana',
                    'failed',
                    null,
                    null,
                    `Insufficient balance. Wallet has ${(balance / 1e9).toFixed(6)} SOL, needs ${amount} SOL.`,
                    user_id,
                    marketprice
                );
            } catch (dbError) {
                console.error('Failed to save error transaction:', dbError);
            }
            return res.status(400).json({
                error: `Insufficient balance. Wallet has ${(balance / 1e9).toFixed(6)} SOL, needs ${amount} SOL.`,
            });
        }

        const toPublicKey = new PublicKey(toAddress);
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: toPublicKey,
                lamports: lamports,
            })
        );

        const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);

        // Store successful transaction in database
        try {
            await saveTransaction(
                signature,
                fromAddress,
                toAddress,
                amount,
                'solana',
                'solana',
                'success',
                null,
                null,
                null,
                user_id,
                marketprice
            );
        } catch (dbError) {
            console.error('Failed to save Solana transaction:', dbError);
        }

        res.status(200).json({
            message: 'Solana transaction successful',
            success: true,
            signature: signature,
            network: 'solana'
        });

    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'solana',
                'solana',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};


// XRP Controller
exports.sendXRP = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            // Store failed transaction for missing fields
            try {
                await saveTransaction(
                    'failed_tx_' + Date.now(),
                    req.body.fromAddress || 'unknown',
                    req.body.toAddress || 'unknown',
                    req.body.amount || '0',
                    'xrp',
                    'xrp',
                    'failed',
                    null,
                    null,
                    'Missing required fields',
                    req.body.user_id,
                    req.body.marketprice
                );
            } catch (dbError) {
                console.error('Failed to save error transaction:', dbError);
            }
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const client = new xrpl.Client(process.env.XRPL_SERVER || 'wss://xrplcluster.com');
        await client.connect();

        const wallet = xrpl.Wallet.fromSeed(privateKey);

        // Verify address matches
        if (wallet.classicAddress !== fromAddress) {
            throw new Error('Private key does not match the provided address');
        }

        const payment = {
            TransactionType: "Payment",
            Account: fromAddress,
            Amount: xrpl.xrpToDrops(amount.toString()),
            Destination: toAddress,
        };

        const prepared = await client.autofill(payment);
        const signed = wallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        await client.disconnect();

        // Store successful transaction in database
        try {
            await saveTransaction(
                result.result.hash,
                fromAddress,
                toAddress,
                amount,
                'xrp',
                'xrp',
                'success',
                null,
                null,
                null,
                user_id,
                marketprice
            );
        } catch (dbError) {
            console.error('Failed to save XRP transaction:', dbError);
        }

        res.status(200).json({
            message: 'XRP transaction successful',
            success: true,
            hash: result.result.hash,
            network: 'xrp'
        });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'xrp',
                'xrp',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};

// TRON Controller
exports.sendTron = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            // Store failed transaction for missing fields
            try {
                await saveTransaction(
                    'failed_tx_' + Date.now(),
                    req.body.fromAddress || 'unknown',
                    req.body.toAddress || 'unknown',
                    req.body.amount || '0',
                    'tron',
                    'tron',
                    'failed',
                    null,
                    null,
                    'Missing required fields',
                    req.body.user_id,
                    req.body.marketprice
                );
            } catch (dbError) {
                console.error('Failed to save error transaction:', dbError);
            }
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const tronWeb = new TronWeb({
            fullHost: process.env.TRON_FULL_HOST || 'https://api.trongrid.io',
            privateKey: privateKey
        });

        // Verify address matches
        const addressFromPrivateKey = tronWeb.address.fromPrivateKey(privateKey);
        if (addressFromPrivateKey !== fromAddress) {
            throw new Error('Private key does not match the provided address');
        }

        // Check balance
        const balance = await tronWeb.trx.getBalance(fromAddress);
        const amountSun = tronWeb.toSun(amount); // Convert TRX to SUN
        if (balance < amountSun) {
            // Store failed transaction for insufficient balance
            try {
                await saveTransaction(
                    'failed_tx_' + Date.now(),
                    fromAddress,
                    toAddress,
                    amount,
                    'tron',
                    'tron',
                    'failed',
                    null,
                    null,
                    `Insufficient TRX balance. Available: ${tronWeb.fromSun(balance)} TRX, Required: ${amount} TRX`,
                    user_id,
                    marketprice
                );
            } catch (dbError) {
                console.error('Failed to save error transaction:', dbError);
            }
            return res.status(400).json({ error: `Insufficient TRX balance. Available: ${tronWeb.fromSun(balance)} TRX, Required: ${amount} TRX` });
        }

        // Check bandwidth
        const accountResources = await tronWeb.trx.getAccountResources(fromAddress);
        const freeBandwidth = accountResources.freeNetLimit - (accountResources.freeNetUsed || 0);
        if (freeBandwidth < 300) {
            // Store failed transaction for insufficient bandwidth
            try {
                await saveTransaction(
                    'failed_tx_' + Date.now(),
                    fromAddress,
                    toAddress,
                    amount,
                    'tron',
                    'tron',
                    'failed',
                    null,
                    null,
                    'Insufficient bandwidth. Freeze TRX or ensure sufficient TRX for fees.',
                    user_id,
                    marketprice
                );
            } catch (dbError) {
                console.error('Failed to save error transaction:', dbError);
            }
            return res.status(400).json({ error: 'Insufficient bandwidth. Freeze TRX or ensure sufficient TRX for fees.' });
        }

        // Create and send transaction
        const transaction = await tronWeb.transactionBuilder.sendTrx(toAddress, amountSun, fromAddress);
        const signedTransaction = await tronWeb.trx.sign(transaction);
        const result = await tronWeb.trx.sendRawTransaction(signedTransaction);

        if (!result.result) {
            throw new Error('Transaction broadcast failed');
        }

        // Verify transaction status
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for network processing
        const txInfo = await tronWeb.trx.getTransactionInfo(result.txid);
        if (!txInfo || txInfo.receipt?.result !== 'SUCCESS') {
            throw new Error('Transaction failed on the blockchain');
        }

        // Store successful transaction in database
        try {
            await saveTransaction(
                result.txid,
                fromAddress,
                toAddress,
                amount,
                'tron',
                'tron',
                'success',
                null,
                null,
                null,
                user_id,
                marketprice
            );
        } catch (dbError) {
            console.error('Failed to save TRON transaction:', dbError);
        }

        res.status(200).json({
            message: 'TRON transaction successful',
            success: true,
            txid: result.txid,
            network: 'tron'
        });
    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'tron',
                'tron',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message });
    }
};
// Helper function for TRON token transfers
async function sendTronToken(fromAddress, privateKey, toAddress, amount, contractAddress) {
    const tronWeb = new TronWeb({
        fullHost: process.env.TRON_FULL_HOST || 'https://api.trongrid.io',
        privateKey
    });

    // Verify address matches
    const addressFromPrivateKey = tronWeb.address.fromPrivateKey(privateKey);
    if (addressFromPrivateKey !== fromAddress) {
        throw new Error('Private key does not match the provided address');
    }

    // Check TRX balance for fees
    const balance = await tronWeb.trx.getBalance(fromAddress);
    if (balance < tronWeb.toSun(1)) {
        throw new Error(`Insufficient TRX for fees. Available: ${tronWeb.fromSun(balance)} TRX`);
    }

    // Check USDT/USDC balance
    const contract = await tronWeb.contract().at(contractAddress);
    const decimals = await contract.decimals().call();
    const tokenBalance = await contract.balanceOf(fromAddress).call();
    
    // Convert amount to proper units (for 6 decimals: multiply by 10^6)
    const amountWei = tronWeb.toBigNumber(amount).multipliedBy(Math.pow(10, decimals));
    
    if (tokenBalance.lt(amountWei)) {
        const readableBalance = tokenBalance.dividedBy(Math.pow(10, decimals)).toString();
        throw new Error(`Insufficient token balance. Available: ${readableBalance}, Required: ${amount}`);
    }

    // Check energy
    const resources = await tronWeb.trx.getAccountResources(fromAddress);
    const energyAvailable = resources.EnergyLimit - (resources.EnergyUsed || 0);
    if (energyAvailable < 35000) {
        throw new Error('Insufficient energy. Freeze TRX or ensure sufficient TRX for fees.');
    }

    // Send USDT transaction
    const transaction = await contract.transfer(toAddress, amountWei).send({
        from: fromAddress,
        feeLimit: tronWeb.toSun(10), // Adjust as needed
        callValue: 0
    });

    // Verify transaction
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for network processing
    const txInfo = await tronWeb.trx.getTransactionInfo(transaction);
    if (!txInfo || txInfo.receipt?.result !== 'SUCCESS') {
        throw new Error('Transaction failed on the blockchain');
    }

    return { success: true, txid: transaction, network: 'tron' };
}

// Cardano Controller
exports.sendCardano = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const lovelaceAmount = Math.round(parseFloat(amount) * 1_000_000); // Convert ADA to Lovelace

        // ✅ Use POST request to Koios
        const koiosResponse = await axios.post('https://api.koios.rest/api/v1/address_info', {
            _addresses: [fromAddress]
        });

        const data = koiosResponse.data;
        const balance = data?.[0]?.balance?.reduce((sum, b) => {
            return b.unit === 'lovelace' ? sum + parseInt(b.quantity) : sum;
        }, 0) || 0;

        if (balance == 0) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        if (balance < lovelaceAmount + 200_000) {
            return res.status(400).json({
                error: 'Insufficient balance for this transaction + network fees.',
                availableLovelace: balance
            });
        }

        return res.status(200).json({
            message: 'Cardano transaction can proceed',
            availableLovelace: balance,
            lovelaceAmount,
            note: 'Next step: Build, sign, and submit the transaction'
        });

    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'cardano',
                'cardano',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        res.status(500).json({ error: error.message || 'Failed to fetch balance' });
    }
};

// SUI Controller

exports.sendSUI = async (req, res) => {
    try {
        const { fromAddress, privateKey, toAddress, amount, user_id, marketprice } = req.body;

        if (!fromAddress || !privateKey || !toAddress || !amount) {
            // Store failed transaction for missing fields
            try {
                await saveTransaction(
                    'failed_tx_' + Date.now(),
                    req.body.fromAddress || 'unknown',
                    req.body.toAddress || 'unknown',
                    req.body.amount || '0',
                    'sui',
                    'sui',
                    'failed',
                    null,
                    null,
                    'Missing required fields',
                    req.body.user_id,
                    req.body.marketprice
                );
            } catch (dbError) {
                console.error('Failed to save error transaction:', dbError);
            }
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { bech32 } = require('bech32');
        const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
        const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
        const { TransactionBlock } = require('@mysten/sui.js/transactions');

        // Use mainnet
        const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

        let keypair;

        // Handle both Bech32 and raw hex formats
        if (privateKey.startsWith('suiprivkey1')) {
            const decoded = bech32.decode(privateKey);
            const words = bech32.fromWords(decoded.words);
            const privateKeyBytes = new Uint8Array(words);
            console.log('🔍 Bech32 Private Key Bytes Length:', privateKeyBytes.length);
            if (privateKeyBytes.length !== 33) {
                // Store failed transaction for invalid private key
                try {
                    await saveTransaction(
                        'failed_tx_' + Date.now(),
                        fromAddress,
                        toAddress,
                        amount,
                        'sui',
                        'sui',
                        'failed',
                        null,
                        null,
                        `Invalid Bech32 private key length. Expected 33 bytes, got ${privateKeyBytes.length}.`,
                        user_id,
                        marketprice
                    );
                } catch (dbError) {
                    console.error('Failed to save error transaction:', dbError);
                }
                return res.status(400).json({ error: `Invalid Bech32 private key length. Expected 33 bytes, got ${privateKeyBytes.length}.` });
            }
            // Strip the first byte (flag) to get the 32-byte private key
            const privateKeySeed = privateKeyBytes.slice(1, 33);
            console.log('🔍 Private Key Seed Length:', privateKeySeed.length);
            if (privateKeySeed.length !== 32) {
                // Store failed transaction for invalid private key seed
                try {
                    await saveTransaction(
                        'failed_tx_' + Date.now(),
                        fromAddress,
                        toAddress,
                        amount,
                        'sui',
                        'sui',
                        'failed',
                        null,
                        null,
                        'Invalid private key seed length after slicing. Expected 32 bytes.',
                        user_id,
                        marketprice
                    );
                } catch (dbError) {
                    console.error('Failed to save error transaction:', dbError);
                }
                return res.status(400).json({ error: 'Invalid private key seed length after slicing. Expected 32 bytes.' });
            }
            keypair = Ed25519Keypair.fromSecretKey(privateKeySeed);
        } else {
            const privateKeyBytes = Uint8Array.from(Buffer.from(privateKey, 'hex'));
            if (privateKeyBytes.length !== 32) {
                // Store failed transaction for invalid private key length
                try {
                    await saveTransaction(
                        'failed_tx_' + Date.now(),
                        fromAddress,
                        toAddress,
                        amount,
                        'sui',
                        'sui',
                        'failed',
                        null,
                        null,
                        'Invalid secret key length. Expected 32 bytes (64 hex chars).',
                        user_id,
                        marketprice
                    );
                } catch (dbError) {
                    console.error('Failed to save error transaction:', dbError);
                }
                return res.status(400).json({ error: 'Invalid secret key length. Expected 32 bytes (64 hex chars).' });
            }
            keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
        }

        // Normalize addresses for comparison
        const derivedAddress = keypair.getPublicKey().toSuiAddress().toLowerCase().replace(/^0x/, '');
        const normalizedFrom = fromAddress.toLowerCase().replace(/^0x/, '');

        console.log('🔑 Derived Address:', derivedAddress);
        console.log('🧾 Provided Address:', normalizedFrom);
        console.log('🔍 Address Comparison:', {
            derivedAddress,
            normalizedFrom,
            areEqual: derivedAddress === normalizedFrom,
            derivedLength: derivedAddress.length,
            normalizedLength: normalizedFrom.length,
            derivedChars: derivedAddress.split('').map(c => c.charCodeAt(0)),
            normalizedChars: normalizedFrom.split('').map(c => c.charCodeAt(0))
        });

        // Validate address match
        if (derivedAddress !== normalizedFrom) {
            // Store failed transaction for address mismatch
            try {
                await saveTransaction(
                    'failed_tx_' + Date.now(),
                    fromAddress,
                    toAddress,
                    amount,
                    'sui',
                    'sui',
                    'failed',
                    null,
                    null,
                    'Private key does not match the provided address',
                    user_id,
                    marketprice
                );
            } catch (dbError) {
                console.error('Failed to save error transaction:', dbError);
            }
            return res.status(400).json({
                error: 'Private key does not match the provided address',
                debug: { derivedAddress, normalizedFrom, areEqual: derivedAddress === normalizedFrom }
            });
        }

        // Check balance
        const balance = await client.getBalance({
            owner: fromAddress,
            coinType: '0x2::sui::SUI'
        });
        const totalBalanceMist = parseInt(balance.totalBalance);
        const amountMist = Math.round(parseFloat(amount) * 1e9); // Convert SUI to Mist
        const gasBudget = 10000000; // 10M Mist for gas (adjust as needed)
        const totalRequiredMist = amountMist + gasBudget;

        console.log('🔍 Wallet Balance (Mist):', totalBalanceMist);
        console.log('🔍 Required Amount (Mist):', amountMist);
        console.log('🔍 Gas Budget (Mist):', gasBudget);
        console.log('🔍 Total Required (Mist):', totalRequiredMist);

        if (totalBalanceMist < totalRequiredMist) {
            // Store failed transaction for insufficient balance
            try {
                await saveTransaction(
                    'failed_tx_' + Date.now(),
                    fromAddress,
                    toAddress,
                    amount,
                    'sui',
                    'sui',
                    'failed',
                    null,
                    null,
                    `Insufficient balance. Available: ${totalBalanceMist / 1e9} SUI, Required: ${(totalRequiredMist / 1e9).toFixed(6)} SUI (including gas)`,
                    user_id,
                    marketprice
                );
            } catch (dbError) {
                console.error('Failed to save error transaction:', dbError);
            }
            return res.status(400).json({
                error: `Insufficient balance. Available: ${totalBalanceMist / 1e9} SUI, Required: ${(totalRequiredMist / 1e9).toFixed(6)} SUI (including gas)`
            });
        }

        const tx = new TransactionBlock();
        const [coin] = tx.splitCoins(tx.gas, [tx.pure(amountMist)]);
        tx.transferObjects([coin], tx.pure(toAddress));

        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: {
                gasBudget: gasBudget // Explicit gas budget
            }
        });

        // Store successful transaction in database
        try {
            await saveTransaction(
                result.digest,
                fromAddress,
                toAddress,
                amount,
                'sui',
                'sui',
                'success',
                null,
                null,
                null,
                user_id,
                marketprice
            );
        } catch (dbError) {
            console.error('Failed to save SUI transaction:', dbError);
        }

        res.status(200).json({
            message: 'SUI transaction successful',
            success: true,
            digest: result.digest,
            network: 'sui',
        });

    } catch (error) {
        // Store failed transaction
        try {
            await saveTransaction(
                'failed_tx_' + Date.now(),
                req.body.fromAddress || 'unknown',
                req.body.toAddress || 'unknown',
                req.body.amount || '0',
                'sui',
                'sui',
                'failed',
                null,
                null,
                error.message,
                req.body.user_id,
                req.body.marketprice
            );
        } catch (dbError) {
            console.error('Failed to save error transaction:', dbError);
        }
        
        console.error('❌ Error during SUI transaction:', error.message);
        res.status(500).json({ error: error.message });
    }
};

