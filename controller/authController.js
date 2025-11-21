const { RegisteruserModel } = require('../models/RegisterUser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { ethers } = require('ethers');
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const secp256k1 = require('@bitcoinerlab/secp256k1');
const { Keypair } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');
const xrpl = require('xrpl');
const crypto = require('crypto');
const bip39 = require('bip39');
const TronWeb = require('tronweb'); // Add this import for TRON support
// Or this one
const Cardano = require('@emurgo/cardano-serialization-lib-nodejs');
//SUI imports
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { fromB64, toB64 } = require('@mysten/bcs');
const { Buffer } = require('buffer');





const ECPair = ECPairFactory(secp256k1.secp256k1 || secp256k1);

// Define network for Litecoin (Bitcoin-like)
const litecoinNetwork = {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'ltc',
    bip32: { public: 0x019da462, private: 0x019d9cfe },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0,
};

// Function to encrypt private key
const encryptPrivateKey = (privateKey, pin) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const key = crypto.pbkdf2Sync(pin, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return { encryptedPrivateKey: encrypted, iv: iv.toString('hex'), authTag, salt };
};

// Function to decrypt private key (for reference, not used in registration)
const decryptPrivateKey = (encryptedPrivateKey, iv, authTag, salt, pin) => {
    const key = crypto.pbkdf2Sync(pin, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

exports.register = async (req, res) => {
    const { name, email, phone, pin, role } = req.body;
    try {
        // Validate environment variables
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.JWT_SECRET) {
            return res.status(500).json({ msg: "Server configuration error" });
        }

        // Check for existing user
        const existing = await RegisteruserModel.findOne({ $or: [{ email }, { phone }] });
        if (existing) {
            return res.status(400).json({ msg: "Email or phone already exists" });
        }

        // Hash the pin
        const hashedPin = await bcrypt.hash(pin.toString(), 10);

        // Generate OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Create crypto wallets
        const wallets = {};

        // Ethereum, BNB, AVAX (EVM-compatible)
        const ethWallet = ethers.Wallet.createRandom();
        const ethEncrypted = encryptPrivateKey(ethWallet.privateKey, pin);
        wallets.ethereum = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'ethereum',
            type: 'native',
            symbol: 'ETH',
            name: 'Ethereum'
        };
        wallets.bnb = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'bsc',
            type: 'native',
            symbol: 'BNB',
            name: 'Binance Coin'
        };
        wallets.avax = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'avalanche',
            type: 'native',
            symbol: 'AVAX',
            name: 'Avalanche'
        };
        // Optimism native token (ETH on Optimism)
        wallets.optimism = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'optimism',
            type: 'native',
            symbol: 'ETH',
            name: 'Ethereum (Optimism)'
        };

        // Arbitrum native token (ETH on Arbitrum)
        wallets.arbitrum = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'arbitrum',
            type: 'native',
            symbol: 'ETH',
            name: 'Ethereum (Arbitrum)'
        };
        // Chainlink token (LINK - ERC-20 on Ethereum)
        wallets.chainlink = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'ethereum',
            type: 'erc20',
            contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK token contract
            decimals: 18,
            symbol: 'LINK',
            name: 'Chainlink'
        };
        
        // AAVE token (ERC-20 on Ethereum)
        wallets.aave = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'ethereum',
            type: 'erc20',
            contractAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // AAVE token contract
            decimals: 18,
            symbol: 'AAVE',
            name: 'Aave'
        };

        // UNI token (Uniswap governance token - ERC-20)
        wallets.uni = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'ethereum',
            type: 'erc20',
            contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI token contract
            decimals: 18,
            symbol: 'UNI',
            name: 'Uniswap'
        };

        // USDT and USDC on Ethereum
        wallets.usdt_ethereum = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'ethereum',
            type: 'erc20',
            contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT contract on Ethereum
            decimals: 6, // USDT has 6 decimals, not 18!
            symbol: 'USDT',
            name: 'Tether USD'
        };
        wallets.usdc_ethereum = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'ethereum',
            type: 'erc20',
            contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC contract on Ethereum
            decimals: 6, // USDC has 6 decimals, not 18!
            symbol: 'USDC',
            name: 'USD Coin'
        };

        // USDT and USDC on Avalanche
        wallets.usdt_avalanche = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'avalanche',
            type: 'erc20',
            contractAddress: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
            decimals: 6,
            symbol: 'USDT',
            name: 'Tether USD (Avalanche)'
        };
        wallets.usdc_avalanche = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'avalanche',
            type: 'erc20',
            contractAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin (Avalanche)'
        };
        // USDT and USDC on Binance Smart Chain
        wallets.usdt_bnb = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'bnb',
            type: 'bep20',
            contractAddress: '0x55d398326f99059fF775485246999027B3197955',
            decimals: 18,
            symbol: 'USDT',
            name: 'Tether USD (BSC)'
        };
        wallets.usdc_bnb = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'bnb',
            type: 'bep20',
            contractAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
            decimals: 18,
            symbol: 'USDC',
            name: 'USD Coin (BSC)'
        };
        // Optimism USDT and USDC
        wallets.usdt_optimism = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'optimism',
            // Example Optimism USDT contract address (mainnet)
            contractAddress: '0x94b008aA00579c1307B0EF2c499aD98a8Ce58e58',
        };

        wallets.usdc_optimism = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'optimism',
            // Example Optimism USDC contract address (mainnet)
            contractAddress: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        };

        // Arbitrum USDT and USDC
        wallets.usdt_arbitrum = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'arbitrum',
            // Example Arbitrum USDT contract address (mainnet)
            contractAddress: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        };

        wallets.usdc_arbitrum = {
            address: ethWallet.address,
            encryptedPrivateKey: ethEncrypted.encryptedPrivateKey,
            iv: ethEncrypted.iv,
            authTag: ethEncrypted.authTag,
            salt: ethEncrypted.salt,
            publicKey: ethWallet.publicKey,
            network: 'arbitrum',
            // Example Arbitrum USDC contract address (mainnet)
            contractAddress: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
        };


        // Bitcoin
        const btcKeyPair = ECPair.makeRandom({ network: bitcoin.networks.bitcoin });
        const btcAddress = bitcoin.payments.p2wpkh({
            pubkey: Buffer.from(btcKeyPair.publicKey),
            network: bitcoin.networks.bitcoin,
        }).address;
        if (!btcAddress) {
            throw new Error('Failed to generate Bitcoin address');
        }
        const btcEncrypted = encryptPrivateKey(btcKeyPair.toWIF(), pin);
        wallets.bitcoin = {
            address: btcAddress,
            encryptedPrivateKey: btcEncrypted.encryptedPrivateKey,
            iv: btcEncrypted.iv,
            authTag: btcEncrypted.authTag,
            salt: btcEncrypted.salt,
            publicKey: Buffer.from(btcKeyPair.publicKey).toString('hex'),
        };

        // Litecoin
        const ltcKeyPair = ECPair.makeRandom({ network: litecoinNetwork });
        const ltcAddress = bitcoin.payments.p2wpkh({
            pubkey: Buffer.from(ltcKeyPair.publicKey),
            network: litecoinNetwork,
        }).address;
        if (!ltcAddress) {
            throw new Error('Failed to generate Litecoin address');
        }
        const ltcEncrypted = encryptPrivateKey(ltcKeyPair.toWIF(), pin);
        wallets.litecoin = {
            address: ltcAddress,
            encryptedPrivateKey: ltcEncrypted.encryptedPrivateKey,
            iv: ltcEncrypted.iv,
            authTag: ltcEncrypted.authTag,
            salt: ltcEncrypted.salt,
            publicKey: Buffer.from(ltcKeyPair.publicKey).toString('hex'),
        };

        // Solana - One wallet for SOL and all SPL tokens
        const solKeyPair = Keypair.generate();
        const solEncrypted = encryptPrivateKey(Buffer.from(solKeyPair.secretKey).toString('hex'), pin);
        
        // SOL (native token)
        wallets.solana = {
            address: solKeyPair.publicKey.toBase58(),
            encryptedPrivateKey: solEncrypted.encryptedPrivateKey,
            iv: solEncrypted.iv,
            authTag: solEncrypted.authTag,
            salt: solEncrypted.salt,
            publicKey: solKeyPair.publicKey.toBase58(),
            network: 'solana',
            type: 'native',
            symbol: 'SOL',
            name: 'Solana'
        };

        // USDT on Solana (SPL Token) - same wallet, different token account
        wallets.usdt_solana = {
            address: solKeyPair.publicKey.toBase58(), // Same wallet address
            encryptedPrivateKey: solEncrypted.encryptedPrivateKey,
            iv: solEncrypted.iv,
            authTag: solEncrypted.authTag,
            salt: solEncrypted.salt,
            publicKey: solKeyPair.publicKey.toBase58(),
            network: 'solana',
            type: 'spl-token',
            mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT SPL token mint
            decimals: 6,
            symbol: 'USDT',
            name: 'Tether USD (Solana)'
        };
        
        // USDC on Solana (SPL Token) - same wallet, different token account
        wallets.usdc_solana = {
            address: solKeyPair.publicKey.toBase58(), // Same wallet address
            encryptedPrivateKey: solEncrypted.encryptedPrivateKey,
            iv: solEncrypted.iv,
            authTag: solEncrypted.authTag,
            salt: solEncrypted.salt,
            publicKey: solKeyPair.publicKey.toBase58(),
            network: 'solana',
            type: 'spl-token',
            mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC SPL token mint
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin (Solana)'
        };

        // XRP
        const xrpWallet = xrpl.Wallet.generate();
        const xrpEncrypted = encryptPrivateKey(xrpWallet.seed, pin);
        wallets.xrp = {
            address: xrpWallet.classicAddress,
            encryptedPrivateKey: xrpEncrypted.encryptedPrivateKey,
            iv: xrpEncrypted.iv,
            authTag: xrpEncrypted.authTag,
            salt: xrpEncrypted.salt,
            publicKey: xrpWallet.publicKey,
        };

        // TRON (TRX)
        const tronAccount = TronWeb.utils.accounts.generateAccount();
        const tronEncrypted = encryptPrivateKey(tronAccount.privateKey, pin);
        wallets.tron = {
            address: tronAccount.address.base58,
            encryptedPrivateKey: tronEncrypted.encryptedPrivateKey,
            iv: tronEncrypted.iv,
            authTag: tronEncrypted.authTag,
            salt: tronEncrypted.salt,
            publicKey: tronAccount.publicKey,
            network: 'tron',
            type: 'native',
            symbol: 'TRX',
            name: 'TRON'
        };

        // USDT and USDC on TRON
        wallets.usdt_tron = {
            address: tronAccount.address.base58,
            encryptedPrivateKey: tronEncrypted.encryptedPrivateKey,
            iv: tronEncrypted.iv,
            authTag: tronEncrypted.authTag,
            salt: tronEncrypted.salt,
            publicKey: tronAccount.publicKey,
            network: 'tron',
            type: 'trc20',
            contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            decimals: 6,
            symbol: 'USDT',
            name: 'Tether USD (TRON)'
        };
        wallets.usdc_tron = {
            address: tronAccount.address.base58,
            encryptedPrivateKey: tronEncrypted.encryptedPrivateKey,
            iv: tronEncrypted.iv,
            authTag: tronEncrypted.authTag,
            salt: tronEncrypted.salt,
            publicKey: tronAccount.publicKey,
            network: 'tron',
            type: 'trc20',
            contractAddress: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin (TRON)'
        };


        const adaEntropy = crypto.randomBytes(32);
        const adaRootKey = Cardano.Bip32PrivateKey.from_bip39_entropy(
            adaEntropy,
            Buffer.from('')
        );

        // Derivation path: m / 1852' / 1815' / 0' / 0 / 0
        const adaAccountKey = adaRootKey
            .derive(1852 | 0x80000000)
            .derive(1815 | 0x80000000)
            .derive(0 | 0x80000000);
        const adaKey = adaAccountKey.derive(0).derive(0);
        const adaPubKey = adaKey.to_public();

        // Get the key hash
        const keyHash = adaPubKey.to_raw_key().hash();

        // Create credential using the correct method
        const credential = Cardano.Credential.from_keyhash(keyHash);

        // Create address
        const adaAddress = Cardano.EnterpriseAddress.new(
            1, // mainnet (0 for testnet)
            credential
        ).to_address().to_bech32();

        const adaPrivateKeyHex = Buffer.from(adaKey.to_raw_key().as_bytes()).toString('hex');
        const adaEncrypted = encryptPrivateKey(adaPrivateKeyHex, pin);

        wallets.cardano = {
            address: adaAddress,
            encryptedPrivateKey: adaEncrypted.encryptedPrivateKey,
            iv: adaEncrypted.iv,
            authTag: adaEncrypted.authTag,
            salt: adaEncrypted.salt,
            publicKey: Buffer.from(adaPubKey.as_bytes()).toString('hex'),
            network: 'cardano',
        };

        // SUI Wallet generation - store raw bytes without slicing
        // SUI Wallet generation
        const suiKeypair = Ed25519Keypair.generate();
        const privateKey = suiKeypair.getSecretKey(); // Store as Bech32 string
        const suiEncrypted = encryptPrivateKey(privateKey, pin);

        wallets.sui = {
            address: suiKeypair.getPublicKey().toSuiAddress(),
            encryptedPrivateKey: suiEncrypted.encryptedPrivateKey,
            iv: suiEncrypted.iv,
            authTag: suiEncrypted.authTag,
            salt: suiEncrypted.salt,
            publicKey: suiKeypair.getPublicKey().toBase64(),
            network: 'sui',
        };

        console.log('✅ SUI Private Key (Bech32):', privateKey);
        console.log('✅ SUI Wallet:', wallets.sui);

        // Generate 24-word BIP-39 mnemonic for recovery
        const mnemonic = bip39.generateMnemonic(256);
        const mnemonicEncrypted = encryptPrivateKey(mnemonic, pin); 

        // // Log wallets and mnemonic to verify
        // console.log('Generated wallets:', JSON.stringify(wallets, null, 2));
        // console.log('Generated mnemonic:', JSON.stringify({ mnemonic, ...mnemonicEncrypted }, null, 2));

        // Create new user with crypto wallets and mnemonic
        const user = new RegisteruserModel({
            name,
            email,
            phone,
            pin: hashedPin,
            role,
            pinResetOtp: otp,
            pinResetOtpExpires: Date.now() + 10 * 60 * 1000,
            isKycApproved: false,
            isEmailVerified: false,
            wallets,
            mnemonic: {
                encryptedMnemonic: mnemonicEncrypted.encryptedPrivateKey,
                iv: mnemonicEncrypted.iv,
                authTag: mnemonicEncrypted.authTag,
                salt: mnemonicEncrypted.salt,
            },
        });

        await user.save();

        // Verify saved data
        const savedUser = await RegisteruserModel.findOne({ email }).lean();
        // console.log('Saved user wallets:', JSON.stringify(savedUser.wallets, null, 2));
        // console.log('Saved mnemonic:', JSON.stringify(savedUser.mnemonic, null, 2));

        // Configure email transport
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Send OTP email (no mnemonic)
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Anan Pay Registration',
            text: `Your OTP for email verification is: ${otp}. It expires in 10 minutes.`,
        });

        // Return mnemonic for testing (remove in production)
        res.status(201).json({
            msg: "OTP sent to email for verification",
            mnemonic // Remove in production; use secure UI prompt
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

exports.Decrypt = async (req, res) => {
    const { email, pin } = req.body;
    try {
        const user = await RegisteruserModel.findOne({ email }).lean();
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (!user.wallets || !user.mnemonic) {
            return res.status(400).json({ msg: 'Wallet or mnemonic data missing' });
        }

        // Decrypt private keys for all cryptocurrencies
        const decryptedKeys = {};
        const walletTypes = [
            'ethereum', 'bnb', 'avax', 'optimism', 'arbitrum', 'chainlink', 'aave', 'uni', 'bitcoin', 'litecoin', 'solana', 'xrp', 'tron',
            'usdt_ethereum', 'usdc_ethereum', 'usdt_avalanche', 'usdc_avalanche', 'usdt_bnb', 'usdc_bnb',
            'usdt_solana', 'usdc_solana', 'usdt_tron', 'usdc_tron', 'usdt_optimism', 'usdc_optimism', 'usdt_arbitrum', 'usdc_arbitrum', 'cardano', 'sui'
        ];

        for (const walletType of walletTypes) {
            if (user.wallets[walletType]) {
                try {
                    decryptedKeys[walletType] = decryptPrivateKey(
                        user.wallets[walletType].encryptedPrivateKey,
                        user.wallets[walletType].iv,
                        user.wallets[walletType].authTag,
                        user.wallets[walletType].salt,
                        pin
                    );
                } catch (err) {
                    console.error(`Failed to decrypt ${walletType} private key:`, err);
                    decryptedKeys[walletType] = 'Decryption failed';
                }
            } else {
                decryptedKeys[walletType] = 'Wallet not found';
            }
        }

        // Decrypt mnemonic
        let decryptedMnemonic;
        try {
            decryptedMnemonic = decryptPrivateKey(
                user.mnemonic.encryptedMnemonic,
                user.mnemonic.iv,
                user.mnemonic.authTag,
                user.mnemonic.salt,
                pin
            );
        } catch (err) {
            console.error('Failed to decrypt mnemonic:', err);
            decryptedMnemonic = 'Decryption failed';
        }

        // Return decrypted keys and mnemonic (for testing only)
        res.json({
            decryptedKeys,
            decryptedMnemonic
        });
    } catch (err) {
        console.error('Decryption error:', err);
        res.status(500).json({ msg: 'Decryption error', error: err.message });
    }
};

exports.resendOtp = async (req, res) => {
    const { email } = req.body;
    try {
        // Validate environment variables
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ msg: "Server configuration error" });
        }

        // Find user
        const user = await RegisteruserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "Email not found" });
        }

        // Generate new OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        user.pinResetOtp = otp;
        user.pinResetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 mins expiry
        await user.save();

        // Configure email transport
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Send OTP email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Anan Pay',
            text: `Your OTP for : ${otp}. It expires in 10 minutes.`,
        });

        res.status(200).json({ msg: "New OTP sent to email for PIN reset" });
    } catch (err) {
        console.error('Resend OTP error:', err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await RegisteruserModel.findOne({
            email,
            pinResetOtp: otp,
            pinResetOtpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: "Invalid or expired OTP" });
        }

        // Clear OTP fields and mark email as verified
        user.pinResetOtp = undefined;
        user.pinResetOtpExpires = undefined;
        user.isEmailVerified = true;
        await user.save();

        res.status(200).json({ msg: "Email verified. You can now login." });
    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, pin } = req.body;
    try {
        // Validate environment variables
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ msg: "Server configuration error" });
        }

        // Find user
        const user = await RegisteruserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "Invalid email" });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(400).json({ msg: "Email not verified. Please verify your email first." });
        }

        // Verify pin
        const match = await bcrypt.compare(pin.toString(), user.pin);
        if (!match) {
            return res.status(400).json({ msg: "Invalid pin" });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id,name: user.name , email: user.email, role: user.role, isKycApproved: user.isKycApproved, isEmailVerified: user.isEmailVerified, wallets: user.wallets },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

exports.resetPin = async (req, res) => {
    const { email, otp, newPin } = req.body;
    try {
        // Find user with valid OTP
        const user = await RegisteruserModel.findOne({
            email,
            pinResetOtp: otp,
            pinResetOtpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: "Invalid or expired OTP" });
        }

        // Hash new pin
        const hashedPin = await bcrypt.hash(newPin.toString(), 10);

        // Update pin and clear OTP fields
        user.pin = hashedPin;
        user.pinResetOtp = undefined;
        user.pinResetOtpExpires = undefined;
        user.isEmailVerified = true; // Ensure email remains verified
        await user.save();

        res.status(200).json({ msg: "PIN reset successfully. You can now login with the new PIN." });
    } catch (err) {
        console.error('PIN reset error:', err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await RegisteruserModel.find({}, {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            role: 1,
            isKycApproved: 1,
            isEmailVerified: 1,
            createdAt: 1
        }).lean();

        const formattedUsers = users.map((user, index) => ({
            id: user._id.toString(),
            name: user.name || 'N/A',
            email: user.email || 'N/A',
            phone: user.phone ? `+${user.phone}` : 'N/A',
            status: user.isEmailVerified ? 'ACTIVE' : 'INACTIVE',
            role: user.role ? user.role.toUpperCase() : 'USER',
            isKycApproved: user.isKycApproved || false,
            createdAt: user.createdAt || new Date()
        }));

        res.status(200).json({
            success: true,
            data: formattedUsers,
            total: formattedUsers.length
        });
    } catch (err) {
        console.error('Get all users error:', err);
        res.status(500).json({ success: false, msg: "Server error", error: err.message });
    }
};

