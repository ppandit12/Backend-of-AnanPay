const { ethers } = require('ethers');
const { Connection, Transaction, VersionedTransaction, Keypair, sendAndConfirmTransaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { getFullnodeUrl, SuiClient } = require('@mysten/sui.js/client');
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const tinysecp = require('tiny-secp256k1');
const TransactionModel = require('../models/Transaction');

// Initialize ECPair for Bitcoin operations
const ECPair = ECPairFactory(tinysecp);

// Multi-RPC configurations for EVM chains with fallback support
const NETWORKS = {
    ethereum: {
        rpcUrls: [
            'https://eth.llamarpc.com',
            'https://rpc.ankr.com/eth',
            'https://ethereum.publicnode.com',
            process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/YXGkhE6xdFPn_cRUEwgKC'
        ],
        chainId: 1,
        symbol: 'ETH'
    },
    bnb: {
        rpcUrls: [
            'https://bsc-dataseed1.binance.org/',
            'https://bsc-dataseed2.binance.org/',
            'https://rpc.ankr.com/bsc',
            process.env.BNB_RPC || 'https://bsc-dataseed3.binance.org/'
        ],
        chainId: 56,
        symbol: 'BNB'
    },
    avalanche: {
        rpcUrls: [
            'https://api.avax.network/ext/bc/C/rpc',
            'https://rpc.ankr.com/avalanche',
            'https://avalanche-c-chain.publicnode.com',
            process.env.AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc'
        ],
        chainId: 43114,
        symbol: 'AVAX'
    },
    optimism: {
        rpcUrls: [
            'https://mainnet.optimism.io',
            'https://rpc.ankr.com/optimism',
            'https://optimism.publicnode.com',
            process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io'
        ],
        chainId: 10,
        symbol: 'ETH'
    },
    arbitrum: {
        rpcUrls: [
            'https://arb1.arbitrum.io/rpc',
            'https://rpc.ankr.com/arbitrum',
            'https://arbitrum-one.publicnode.com',
            process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc'
        ],
        chainId: 42161,
        symbol: 'ETH'
    }
};

// Function to get provider with fallback support
async function getProviderWithFallback(networkName) {
    const network = NETWORKS[networkName];
    if (!network) {
        throw new Error(`Unsupported network: ${networkName}`);
    }

    for (let i = 0; i < network.rpcUrls.length; i++) {
        try {
            const rpcUrl = network.rpcUrls[i];
            console.log(`🔗 Trying RPC ${i + 1}/${network.rpcUrls.length} for ${networkName}: ${rpcUrl.substring(0, 50)}...`);
            
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            
            // Test the connection with a simple call
            await provider.getNetwork();
            
            console.log(`✅ Successfully connected to ${networkName} RPC ${i + 1}`);
            return provider;
            
        } catch (error) {
            console.log(`❌ RPC ${i + 1} failed for ${networkName}: ${error.message}`);
            
            // If this is the last RPC, throw the error
            if (i === network.rpcUrls.length - 1) {
                throw new Error(`All RPC endpoints failed for ${networkName}. Last error: ${error.message}`);
            }
            
            // Continue to next RPC
            continue;
        }
    }
}

// Chain ID to network name mapping
const CHAIN_ID_TO_NETWORK = {
    1: 'ethereum',
    56: 'bnb',
    43114: 'avalanche',
    10: 'optimism',
    42161: 'arbitrum',
    1151111081099710: 'solana', // Solana chain ID from your lifi.md
    9270000000000000: 'sui', // SUI chain ID from your lifi.md
    20000000000001: 'bitcoin' // Bitcoin chain ID from your lifi.md
};

// Function to save transaction to database
async function saveSwapTransaction(txHash, fromCoin, toCoin, fromAmount, toAmount, status = 'pending', errorMessage = null, user_id = null, network = 'cross_chain_swap', blockNumber = null, gasUsed = null, actualFromAddress = null, actualToAddress = null) {
    try {
        const transaction = new TransactionModel({
            user_id,
            txHash,
            fromAddress: actualFromAddress || 'swap_transaction',
            toAddress: actualToAddress || 'swap_transaction',
            amount: fromAmount ? fromAmount.toString() : '0',
            cryptocurrency: `${fromCoin}_cross_chain`,
            network,
            status,
            blockNumber,
            gasUsed,
            errorMessage,
            swapDetails: {
                fromCoin,
                toCoin,
                fromAmount: fromAmount ? fromAmount.toString() : null,
                toAmount: toAmount ? toAmount.toString() : null,
                actualFromAddress,
                actualToAddress
            }
        });
        
        await transaction.save();
        return transaction._id;
    } catch (error) {
        console.error('Failed to save swap transaction:', error);
        return null;
    }
}

// =============================================================================
// TOKEN APPROVAL HANDLER FOR USDT/USDC
// =============================================================================

async function checkAndApproveToken(privateKey, tokenAddress, approvalAddress, amount, networkName) {
    try {
        const network = NETWORKS[networkName];
        if (!network) {
            throw new Error(`Unsupported network: ${networkName}`);
        }

        const provider = await getProviderWithFallback(networkName);
        const wallet = new ethers.Wallet(privateKey, provider);

        // ERC-20 Token contract ABI for approval
        const tokenABI = [
            'function allowance(address owner, address spender) view returns (uint256)',
            'function approve(address spender, uint256 amount) returns (bool)',
            'function decimals() view returns (uint8)',
            'function balanceOf(address account) view returns (uint256)'
        ];

        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);

        // Check current allowance
        const currentAllowance = await tokenContract.allowance(wallet.address, approvalAddress);
        const requiredAmount = ethers.parseUnits(amount.toString(), await tokenContract.decimals());

        console.log(`🔍 Current allowance: ${ethers.formatUnits(currentAllowance, await tokenContract.decimals())}`);
        console.log(`🔍 Required amount: ${ethers.formatUnits(requiredAmount, await tokenContract.decimals())}`);

        // If allowance is sufficient, no need to approve
        if (currentAllowance >= requiredAmount) {
            console.log(`✅ Token approval already sufficient`);
            return { success: true, message: 'Approval already sufficient' };
        }

        // Approve tokens
        console.log(`🔐 Approving tokens for swap contract...`);
        const approveTx = await tokenContract.approve(approvalAddress, requiredAmount);
        const approveReceipt = await approveTx.wait();

        console.log(`✅ Token approval successful. Tx: ${approveTx.hash}`);
        
        return {
            success: true,
            approvalTxHash: approveTx.hash,
            approvalBlockNumber: approveReceipt.blockNumber
        };

    } catch (error) {
        console.error(`❌ Token approval failed:`, error);
        throw new Error(`Token approval failed: ${error.message}`);
    }
}

// =============================================================================
// EVM TRANSACTION HANDLER (ETH, BNB, AVAX, etc.) - WITH FALLBACK & FAST RESPONSE
// =============================================================================

async function executeEVMSwap(privateKey, transactionRequest, networkName) {
    try {
        const network = NETWORKS[networkName];
        if (!network) {
            throw new Error(`Unsupported EVM network: ${networkName}`);
        }

        // Validate private key and derive address (matching sendTransaction.js pattern)
        let wallet;
        try {
            wallet = new ethers.Wallet(privateKey);
        } catch (error) {
            throw new Error('Invalid private key format');
        }

        // Get provider with fallback support
        const provider = await getProviderWithFallback(networkName);
        const walletWithProvider = wallet.connect(provider);

        // Validate transaction request structure
        if (!transactionRequest.to || !transactionRequest.data) {
            throw new Error('Invalid EVM transaction request: missing "to" or "data" fields');
        }

        // Validate if from address in request matches private key (like sendTransaction.js)
        if (transactionRequest.from) {
            const derivedAddress = wallet.address.toLowerCase();
            const providedAddress = transactionRequest.from.toLowerCase();
            if (derivedAddress !== providedAddress) {
                throw new Error(`Private key does not match provided address. Expected: ${derivedAddress}, Got: ${providedAddress}`);
            }
        }

        // Check balance (following sendTransaction.js pattern)
        const balance = await provider.getBalance(wallet.address);
        // Parse value correctly - it comes as hex string in wei, not ETH
        const requiredAmount = transactionRequest.value ? BigInt(transactionRequest.value) : BigInt(0);
        const gasLimit = transactionRequest.gasLimit || transactionRequest.gas || BigInt("300000");
        const gasPrice = transactionRequest.gasPrice ? BigInt(transactionRequest.gasPrice) : await provider.getGasPrice();
        const estimatedGasCost = BigInt(gasLimit.toString()) * BigInt(gasPrice.toString());
        const totalRequired = requiredAmount + estimatedGasCost;

        console.log(`🔍 ${networkName.toUpperCase()} Balance:`, ethers.formatEther(balance));
        console.log(`🔍 Required Amount:`, ethers.formatEther(requiredAmount));
        console.log(`🔍 Estimated Gas Cost:`, ethers.formatEther(estimatedGasCost));
        console.log(`🔍 Total Required:`, ethers.formatEther(totalRequired));

        if (balance < totalRequired) {
            throw new Error(`Insufficient balance. Available: ${ethers.formatEther(balance)} ${network.symbol}, Required: ${ethers.formatEther(totalRequired)} ${network.symbol} (including gas)`);
        }

        // Prepare transaction with better gas handling
        const tx = {
            to: transactionRequest.to,
            data: transactionRequest.data,
            value: transactionRequest.value || '0x0',
            chainId: network.chainId
        };

        // Add gas fields if provided, otherwise let ethers estimate
        if (transactionRequest.gasLimit || transactionRequest.gas) {
            tx.gasLimit = transactionRequest.gasLimit || transactionRequest.gas;
        }
        
        if (transactionRequest.gasPrice) {
            tx.gasPrice = transactionRequest.gasPrice;
        } else if (transactionRequest.maxFeePerGas && transactionRequest.maxPriorityFeePerGas) {
            tx.maxFeePerGas = transactionRequest.maxFeePerGas;
            tx.maxPriorityFeePerGas = transactionRequest.maxPriorityFeePerGas;
        }

        // Remove undefined fields
        Object.keys(tx).forEach(key => tx[key] === undefined && delete tx[key]);

        console.log(`🔹 Executing EVM swap on ${networkName}:`, {
            to: tx.to,
            value: tx.value,
            chainId: tx.chainId,
            dataLength: tx.data.length
        });

        // Send transaction and wait for confirmation (matching sendTransaction.js pattern)
        const txResponse = await walletWithProvider.sendTransaction(tx);
        console.log(`📝 Transaction sent with hash: ${txResponse.hash}`);
        
        // Wait for transaction receipt (like sendTransaction.js tx.wait())
        const receipt = await txResponse.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);

        // Check if transaction was successful
        if (receipt.status === 0) {
            throw new Error(`Transaction failed during execution. This is likely due to: 1) Insufficient token approval, 2) Slippage tolerance exceeded, 3) Liquidity issues, or 4) Expired route. Transaction hash: ${receipt.hash}`);
        }

        return {
            success: true,
            txHash: txResponse.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            network: networkName,
            status: receipt.status === 1 ? 'success' : 'failed',
            transactionHash: txResponse.hash  // Adding both for compatibility
        };

    } catch (error) {
        console.error(`❌ EVM swap failed on ${networkName}:`, error);
        
        // Provide more specific error information
        let errorMessage = error.message;
        
        if (error.code === 'CALL_EXCEPTION' && error.receipt && error.receipt.status === 0) {
            errorMessage = `Smart contract execution failed. This is typically due to: 1) Insufficient token approval for the swap contract, 2) Slippage tolerance exceeded, 3) Liquidity pool issues, or 4) Expired swap route. Please check token approvals and try with fresh quotes from LiFi. Transaction hash: ${error.receipt.hash}`;
        } else if (error.code === 'UNKNOWN_ERROR' && error.message.includes('failed to send tx')) {
            errorMessage = 'Transaction rejected by network. This may be due to insufficient funds, invalid transaction data, or network congestion.';
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
            errorMessage = 'Insufficient funds to complete the transaction (including gas fees).';
        } else if (error.code === 'NONCE_EXPIRED') {
            errorMessage = 'Transaction nonce is too low. Please try again.';
        } else if (error.message.includes('rate-limited') || error.message.includes('429')) {
            errorMessage = 'RPC endpoint rate limited. Trying fallback providers...';
        }
        
        // Re-throw the error to be handled by the main controller
        throw new Error(`EVM swap failed on ${networkName}: ${errorMessage}`);
    }
}

// =============================================================================
// SOLANA TRANSACTION HANDLER - WITH FALLBACK SUPPORT
// =============================================================================

async function executeSolanaSwap(privateKey, transactionRequest) {
    try {
        // Validate transaction request
        if (!transactionRequest.data) {
            throw new Error('Invalid Solana transaction request: missing "data" field');
        }

        // Solana RPC endpoints with fallback
        const solanaRPCs = [
            'https://api.mainnet-beta.solana.com',
            'https://solana-api.projectserum.com',
            'https://rpc.ankr.com/solana',
            process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com'
        ];

        let connection = null;
        let connectionError = null;

        // Try to connect to Solana with fallback
        for (let i = 0; i < solanaRPCs.length; i++) {
            try {
                console.log(`🔗 Trying Solana RPC ${i + 1}/${solanaRPCs.length}: ${solanaRPCs[i]}`);
                connection = new Connection(solanaRPCs[i]);
                
                // Test connection
                await connection.getLatestBlockhash();
                console.log(`✅ Successfully connected to Solana RPC ${i + 1}`);
                break;
                
            } catch (error) {
                console.log(`❌ Solana RPC ${i + 1} failed: ${error.message}`);
                connectionError = error;
                
                if (i === solanaRPCs.length - 1) {
                    throw new Error(`All Solana RPC endpoints failed. Last error: ${connectionError.message}`);
                }
                continue;
            }
        }
        
        // Create keypair from private key
        const privateKeyBytes = new Uint8Array(Buffer.from(privateKey, 'hex'));
        const fromKeypair = Keypair.fromSecretKey(privateKeyBytes);

        console.log(`🔹 Executing Solana swap from: ${fromKeypair.publicKey.toBase58()}`);

        // First check SOL balance like in sendTransaction.js
        const solBalance = await connection.getBalance(fromKeypair.publicKey);
        console.log(`💰 SOL Balance: ${solBalance / LAMPORTS_PER_SOL} SOL`);
        
        if (solBalance < 10000) { // ~0.00001 SOL minimum for fees
            throw new Error(`❌ INSUFFICIENT SOL: Balance: ${solBalance / LAMPORTS_PER_SOL} SOL. Need at least 0.00001 SOL for transaction fees.`);
        }

        // Deserialize the base64 transaction
        const serializedTx = Buffer.from(transactionRequest.data, 'base64');

        // Try to handle VersionedTransaction first (required for v0+ messages)
        try {
            const versioned = VersionedTransaction.deserialize(serializedTx);
            console.log('🔹 Detected VersionedTransaction');

            // Try to list account keys and header info for diagnostics
            let accountKeys = [];
            let numRequiredSignatures = null;
            try {
                if (versioned.message && versioned.message.accountKeys) {
                    accountKeys = versioned.message.accountKeys.map(k => k.toBase58 ? k.toBase58() : k.toString());
                } else if (versioned.message && versioned.message.staticAccountKeys) {
                    accountKeys = versioned.message.staticAccountKeys.map(k => k.toBase58 ? k.toBase58() : k.toString());
                } else if (typeof versioned.message.getAccountKeys === 'function') {
                    accountKeys = versioned.message.getAccountKeys().map(k => k.toBase58 ? k.toBase58() : k.toString());
                }
            } catch (kErr) {
                console.log('⚠️ Could not enumerate accountKeys for VersionedTransaction:', kErr.message);
            }

            try {
                if (versioned.message && versioned.message.header) {
                    numRequiredSignatures = versioned.message.header.numRequiredSignatures;
                }
            } catch (hErr) {
                // ignore
            }

            console.log('🔍 Versioned tx diagnostics:', {
                accountKeysCount: accountKeys.length,
                numRequiredSignatures,
                expectedSigners: accountKeys.slice(0, numRequiredSignatures || 1),
                yourPublicKey: fromKeypair.publicKey.toBase58()
            });

            const fromPub = fromKeypair.publicKey.toBase58();
            const signerIndex = accountKeys.indexOf(fromPub);
            if (signerIndex === -1) {
                // If the provided key is not in account keys, return helpful error with expected signers
                const expectedSigners = accountKeys.slice(0, numRequiredSignatures || 1);
                throw new Error(`❌ SIGNER MISMATCH: Your wallet (${fromPub}) is not expected by this transaction. Expected signers: [${expectedSigners.join(', ')}]. When calling LiFi stepTransaction API, use fromAddress: "${fromPub}" to generate a transaction for your wallet.`);
            }

            console.log(`🔹 Provided key is present in account keys at index ${signerIndex}; attempting to sign`);

            // Sign the versioned transaction
            try {
                versioned.sign([fromKeypair]);
                console.log('✅ VersionedTransaction signed successfully');
            } catch (signErr) {
                console.error('❌ Failed to sign VersionedTransaction:', signErr.message);
                throw new Error(`Failed to sign versioned transaction: ${signErr.message}`);
            }
            
            // Serialize the signed transaction
            let signedTx;
            try {
                signedTx = versioned.serialize();
                console.log('✅ VersionedTransaction serialized successfully');
            } catch (serErr) {
                console.error('❌ Failed to serialize VersionedTransaction:', serErr.message);
                throw new Error(`Failed to serialize versioned transaction: ${serErr.message}`);
            }
            
            // Send using sendRawTransaction (proper method for versioned transactions)
            try {
                const signature = await connection.sendRawTransaction(signedTx, {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed'
                });
                console.log(`✅ Solana versioned transaction sent: ${signature}`);

                return {
                    success: true,
                    txHash: signature,
                    network: 'solana',
                    status: 'pending',
                    message: 'Versioned transaction sent successfully.'
                };
            } catch (blockhashError) {
                if (blockhashError.message.includes('Blockhash not found') || blockhashError.message.includes('This transaction has already been processed')) {
                    console.log('⚠️ Blockhash expired, attempting with fresh blockhash...');
                    
                    // For versioned transactions, we need to recreate with fresh blockhash
                    // This is more complex as we need to rebuild the message
                    try {
                        const { blockhash } = await connection.getLatestBlockhash();
                        
                        // Try to update the recent blockhash in the versioned message
                        if (versioned.message && versioned.message.recentBlockhash) {
                            versioned.message.recentBlockhash = blockhash;
                        }
                        
                        // Re-sign with fresh blockhash
                        versioned.sign([fromKeypair]);
                        const freshSignedTx = versioned.serialize();
                        
                        const signature = await connection.sendRawTransaction(freshSignedTx, {
                            skipPreflight: false,
                            preflightCommitment: 'confirmed'
                        });
                        console.log(`✅ Solana versioned transaction sent with fresh blockhash: ${signature}`);

                        return {
                            success: true,
                            txHash: signature,
                            network: 'solana',
                            status: 'pending',
                            message: 'Versioned transaction sent successfully with fresh blockhash.'
                        };
                    } catch (freshError) {
                        console.log('⚠️ Fresh blockhash attempt failed:', freshError.message);
                        throw blockhashError; // Fall back to original error
                    }
                } else if (blockhashError.message.includes('Attempt to debit an account') || 
                           blockhashError.message.includes('insufficient lamports') ||
                           blockhashError.message.includes('Transfer: insufficient lamports')) {
                    // Insufficient balance error
                    throw new Error(`❌ INSUFFICIENT BALANCE: Your wallet (${fromKeypair.publicKey.toBase58()}) doesn't have enough SOL to execute this transaction. Please add SOL to your wallet and try again. Error: ${blockhashError.message}`);
                } else {
                    // Re-throw other errors
                    throw blockhashError;
                }
            }
        } catch (versionErr) {
            console.log('⚠️ VersionedTransaction handling failed:', versionErr.message);
            
            // Check for insufficient balance errors first
            if (versionErr.message.includes('insufficient lamports') || 
                versionErr.message.includes('Transfer: insufficient lamports') ||
                versionErr.message.includes('Attempt to debit an account')) {
                throw new Error(`❌ INSUFFICIENT SOL BALANCE: Your wallet needs more SOL to complete this transaction. Current error: ${versionErr.message}`);
            }
            
            // Check if this is specifically a version-related error that should not fall back to legacy
            if (versionErr.message.includes('VersionedMessage') || 
                versionErr.message.includes('Versioned messages must be deserialized')) {
                throw new Error(`Transaction is versioned but handling failed: ${versionErr.message}`);
            }
            
            // Check if this is a simulation error on a versioned transaction (should not fall back)
            if (versionErr.message.includes('Simulation failed') || 
                versionErr.message.includes('Transaction simulation failed')) {
                throw new Error(`Transaction simulation failed: ${versionErr.message}`);
            }
            
            // For other errors (like signer mismatch), we can try fallback strategies
            console.log('🔹 Trying fallback strategies for non-versioned transaction...');
        }

        // Fallback: first try sending the raw serialized bytes directly
        try {
            console.log('🔹 Attempting to send raw serialized bytes (may already be signed by LiFi)');
            const signatureRaw = await connection.sendRawTransaction(serializedTx);
            console.log(`✅ Raw serialized transaction sent: ${signatureRaw}`);

            return {
                success: true,
                txHash: signatureRaw,
                network: 'solana',
                status: 'pending',
                message: 'Raw serialized transaction sent successfully. Use getSwapStatus to check confirmation.'
            };
        } catch (rawErr) {
            console.log('⚠️ Sending raw serialized tx failed:', rawErr.message);

            // Now try legacy Transaction.from as a last resort (wrap in try/catch for clearer errors)
            try {
                const transaction = Transaction.from(serializedTx);
                console.log(`🔹 Legacy Solana transaction deserialized, signatures needed: ${transaction.signatures.length}`);

                // Sign the transaction
                transaction.sign(fromKeypair);
                console.log(`✅ Solana legacy transaction signed`);

                const rawLegacy = transaction.serialize();
                const signature = await connection.sendRawTransaction(rawLegacy);
                console.log(`✅ Solana legacy transaction sent: ${signature}`);

                return {
                    success: true,
                    txHash: signature,
                    network: 'solana',
                    status: 'pending',
                    message: 'Legacy transaction sent successfully. Use getSwapStatus to check confirmation.'
                };
            } catch (legacyErr) {
                console.error('❌ Legacy Transaction deserialization/sending failed:', legacyErr.message);
                
                // If it's a versioned message error, provide specific guidance
                if (legacyErr.message.includes('Versioned messages must be deserialized')) {
                    throw new Error(`This transaction uses Solana's versioned transaction format, but our versioned transaction handler failed. Please contact support. Original error: ${legacyErr.message}`);
                }
                
                throw new Error(`Solana send failed: ${legacyErr.message}`);
            }
        }

    } catch (error) {
        console.error(`❌ Solana swap failed:`, error);
        
        // Re-throw the error to be handled by the main controller
        // The main controller will save the failed transaction
        throw new Error(`Solana swap failed: ${error.message}`);
    }
}

// =============================================================================
// SUI TRANSACTION HANDLER
// =============================================================================

async function executeSUISwap(privateKey, transactionRequest) {
    try {
        // Validate transaction request
        if (!transactionRequest.data) {
            throw new Error('Invalid SUI transaction request: missing "data" field');
        }

        const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
        
        // Create keypair from private key (matching sendTransaction.js pattern)
        let keypair;
        try {
            if (privateKey.startsWith('suiprivkey1')) {
                // Bech32 format
                keypair = Ed25519Keypair.fromSecretKey(privateKey);
            } else {
                // Hex format - convert to bytes
                const privateKeyBytes = Buffer.from(privateKey.replace('0x', ''), 'hex');
                keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
            }
        } catch (keyError) {
            throw new Error('Invalid SUI private key format');
        }

        const fromAddress = keypair.getPublicKey().toSuiAddress();
        console.log(`🔹 Executing SUI swap from: ${fromAddress}`);

        // Validate address derivation (matching sendTransaction.js pattern)
        if (transactionRequest.from) {
            const normalizedFromRequest = transactionRequest.from.toLowerCase();
            const normalizedDerived = fromAddress.toLowerCase();
            const areEqual = normalizedFromRequest === normalizedDerived;
            
            if (!areEqual) {
                throw new Error(`Private key does not match the provided address. Expected: ${fromAddress}, Got: ${transactionRequest.from}`);
            }
        }

        // Check balance (following sendTransaction.js pattern)
        const balance = await client.getBalance({
            owner: fromAddress,
            coinType: '0x2::sui::SUI'
        });
        const totalBalanceMist = parseInt(balance.totalBalance);
        const gasBudget = 10000000; // 10M Mist for gas (matching sendTransaction.js)

        console.log('🔍 SUI Wallet Balance (Mist):', totalBalanceMist);
        console.log('🔍 Gas Budget (Mist):', gasBudget);

        if (totalBalanceMist < gasBudget) {
            throw new Error(`Insufficient SUI balance. Available: ${totalBalanceMist / 1e9} SUI, Required for gas: ${gasBudget / 1e9} SUI`);
        }

        // Deserialize the base64 transaction
        const serializedTx = Buffer.from(transactionRequest.data, 'base64');
        console.log(`🔹 SUI transaction data length: ${serializedTx.length} bytes`);

        // Execute transaction (matching sendTransaction.js signAndExecuteTransactionBlock pattern)
        const txResponse = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: serializedTx,
            options: {
                showEffects: true,
                showEvents: true,
                gasBudget: gasBudget
            },
        });

        console.log(`✅ SUI transaction confirmed: ${txResponse.digest}`);

        // Check if transaction was successful
        const isSuccess = txResponse.effects?.status?.status === 'success';

        return {
            success: isSuccess,
            txHash: txResponse.digest,
            network: 'sui',
            status: isSuccess ? 'success' : 'failed',
            effects: txResponse.effects,
            transactionHash: txResponse.digest  // Adding both for compatibility
        };

    } catch (error) {
        console.error(`❌ SUI swap failed:`, error);
        
        // Re-throw the error to be handled by the main controller
        // The main controller will save the failed transaction
        throw new Error(`SUI swap failed: ${error.message}`);
    }
}

// =============================================================================
// BITCOIN HELPER FUNCTIONS
// =============================================================================

/**
 * Detect if an address is a Bitcoin address based on format
 * @param {string} address - The address to check
 * @returns {boolean} - True if it's likely a Bitcoin address
 */
function isBitcoinAddress(address) {
    if (!address || typeof address !== 'string') {
        return false;
    }
    
    // Bitcoin address patterns:
    // - Legacy addresses: start with '1'
    // - P2SH addresses: start with '3'  
    // - Bech32 addresses: start with 'bc1'
    // - Testnet bech32: start with 'tb1'
    return /^(1[a-km-z1-9]{25,34}|3[a-km-z1-9]{25,34}|bc1[a-z0-9]{39,59}|tb1[a-z0-9]{39,59})$/i.test(address);
}

/**
 * Detect if data field contains PSBT (Partially Signed Bitcoin Transaction)
 * @param {string} data - The data field to check
 * @returns {boolean} - True if it's likely PSBT data
 */
function isPSBTData(data) {
    if (!data || typeof data !== 'string') {
        return false;
    }
    
    // PSBT data typically starts with "70736274ff" (hex for "psbt" + separator + version)
    return data.startsWith('70736274ff');
}

// =============================================================================
// BITCOIN TRANSACTION HANDLER
// =============================================================================

async function executeBitcoinSwap(privateKey, transactionRequest) {
    try {
        // Bitcoin is different - LiFi gives you a deposit address and amount
        // You need to send BTC to that address manually
        
        if (!transactionRequest.toAddress || !transactionRequest.fromAmount) {
            throw new Error('Invalid Bitcoin transaction request: missing "toAddress" or "fromAmount" fields');
        }

        const { toAddress, fromAmount, memo } = transactionRequest;
        
        console.log(`🔹 Bitcoin swap deposit required:`);
        console.log(`   To Address: ${toAddress}`);
        console.log(`   Amount (satoshis): ${fromAmount}`);
        console.log(`   Memo: ${memo || 'N/A'}`);

        // For Bitcoin, you need to create and send a transaction to the deposit address
        // This is similar to your existing Bitcoin send logic
        
        const amountBTC = parseInt(fromAmount) / 100000000; // Convert satoshis to BTC
        
        // You would implement the actual Bitcoin transaction sending here
        // For now, returning the deposit information
        
        return {
            success: true,
            depositRequired: true,
            toAddress: toAddress,
            amount: amountBTC,
            amountSatoshis: fromAmount,
            memo: memo,
            network: 'bitcoin',
            message: 'Please send Bitcoin to the provided deposit address to complete the swap'
        };

    } catch (error) {
        console.error(`❌ Bitcoin swap failed:`, error);
        
        // Re-throw the error to be handled by the main controller
        // The main controller will save the failed transaction
        throw new Error(`Bitcoin swap failed: ${error.message}`);
    }
}

/**
 * Broadcast Bitcoin transaction to the network
 * @param {string} txHex - Raw transaction hex to broadcast
 * @returns {Promise} - Broadcast result
 */
async function broadcastBitcoinTransaction(txHex) {
    const bitcoinRPCs = [
        'https://blockstream.info/api/tx',
        'https://mempool.space/api/tx',
        'https://btc.com/v1/tx/raw',
        'https://api.blockcypher.com/v1/btc/main/txs/push',
    ];
    
    let lastError = null;
    
    // Try different broadcasting services
    for (let i = 0; i < bitcoinRPCs.length; i++) {
        try {
            console.log(`🔗 Trying Bitcoin broadcast service ${i + 1}/${bitcoinRPCs.length}: ${bitcoinRPCs[i]}`);
            
            let response;
            let result;
            
            if (bitcoinRPCs[i].includes('blockstream.info')) {
                // Blockstream API
                response = await fetch(bitcoinRPCs[i], {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                    body: txHex
                });
                
                if (response.ok) {
                    const txid = await response.text();
                    return {
                        success: true,
                        txid: txid.trim(),
                        service: 'blockstream.info',
                        message: 'Transaction broadcast successful via Blockstream'
                    };
                } else {
                    throw new Error(`Blockstream broadcast failed: ${response.status} ${response.statusText}`);
                }
                
            } else if (bitcoinRPCs[i].includes('mempool.space')) {
                // Mempool.space API
                response = await fetch(bitcoinRPCs[i], {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                    body: txHex
                });
                
                if (response.ok) {
                    const txid = await response.text();
                    return {
                        success: true,
                        txid: txid.trim(),
                        service: 'mempool.space',
                        message: 'Transaction broadcast successful via Mempool.space'
                    };
                } else {
                    throw new Error(`Mempool.space broadcast failed: ${response.status} ${response.statusText}`);
                }
                
            } else if (bitcoinRPCs[i].includes('blockcypher.com')) {
                // BlockCypher API
                response = await fetch(bitcoinRPCs[i], {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tx: txHex
                    })
                });
                
                result = await response.json();
                
                if (response.ok && result.tx && result.tx.hash) {
                    return {
                        success: true,
                        txid: result.tx.hash,
                        service: 'blockcypher.com',
                        message: 'Transaction broadcast successful via BlockCypher'
                    };
                } else {
                    throw new Error(`BlockCypher broadcast failed: ${result.error || 'Unknown error'}`);
                }
                
            } else {
                // Generic API attempt
                response = await fetch(bitcoinRPCs[i], {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        rawtx: txHex
                    })
                });
                
                result = await response.json();
                
                if (response.ok && result.txid) {
                    return {
                        success: true,
                        txid: result.txid,
                        service: bitcoinRPCs[i],
                        message: 'Transaction broadcast successful'
                    };
                } else {
                    throw new Error(`Generic broadcast failed: ${result.error || 'Unknown error'}`);
                }
            }
            
        } catch (error) {
            console.log(`⚠️ Bitcoin broadcast service ${i + 1} failed: ${error.message}`);
            lastError = error;
            continue;
        }
    }
    
    // If all services failed, throw the last error
    throw new Error(`All Bitcoin broadcast services failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Execute Bitcoin swap using PSBT format (LiFi style)
 * @param {string} privateKey - Bitcoin private key in WIF format
 * @param {object} transactionRequest - Transaction request with to, data, value fields
 */
async function executeBitcoinPSBTSwap(privateKey, transactionRequest) {
    try {
        // Validate transaction request for PSBT format
        if (!transactionRequest.to || !transactionRequest.data || !transactionRequest.value) {
            throw new Error('Invalid Bitcoin PSBT transaction request: missing "to", "data", or "value" fields');
        }

        const { to: toAddress, data: psbtHex, value } = transactionRequest;
        
        console.log(`🔹 Bitcoin PSBT swap transaction:`);
        console.log(`   To Address: ${toAddress}`);
        console.log(`   Value (satoshis): ${value}`);
        console.log(`   PSBT Data: ${psbtHex.substring(0, 100)}...`);

        // For Bitcoin PSBT swaps, LiFi provides a Partially Signed Bitcoin Transaction
        // that needs to be completed and broadcasted
        
        // Convert PSBT hex data to Buffer
        const psbtBuffer = Buffer.from(psbtHex, 'hex');
        
        // Create Bitcoin network (mainnet by default)
        const network = bitcoin.networks.bitcoin;
        
        // Create key pair from private key with proper validation
        let keyPair;
        try {
            // Try WIF format first
            keyPair = ECPair.fromWIF(privateKey, network);
            console.log(`🔹 Successfully created keypair from WIF format`);
        } catch (wifError) {
            try {
                // Try hex format if WIF fails
                const privateKeyBuffer = Buffer.from(privateKey, 'hex');
                keyPair = ECPair.fromPrivateKey(privateKeyBuffer, { network });
                console.log(`🔹 Successfully created keypair from hex format`);
            } catch (hexError) {
                throw new Error(`Invalid private key format. Neither WIF nor hex format worked. WIF error: ${wifError.message}, Hex error: ${hexError.message}`);
            }
        }
        
        // Parse PSBT with proper validator
        const psbt = bitcoin.Psbt.fromBuffer(psbtBuffer, {
            maximumFeeRate: 1000000, // 1000 sat/vB max fee rate to prevent high fee errors
        });
        
        // Add validator function for signature verification
        const validator = (pubkey, msghash, signature) => {
            try {
                // Convert Uint8Array to Buffer if needed
                const sigBuffer = signature instanceof Buffer ? signature : Buffer.from(signature);
                const msgBuffer = msghash instanceof Buffer ? msghash : Buffer.from(msghash);
                const pubBuffer = pubkey instanceof Buffer ? pubkey : Buffer.from(pubkey);
                
                return ECPair.fromPublicKey(pubBuffer, { network }).verify(msgBuffer, sigBuffer);
            } catch (error) {
                console.log(`⚠️ Validator error: ${error.message}`);
                return false;
            }
        };
        
        // Set the validator for the PSBT
        psbt.setMaximumFeeRate(1000000); // Prevent high fee errors
        
        console.log(`🔹 PSBT has ${psbt.inputCount} inputs`);
        
        // Get the public key from the private key to check which inputs we can sign
        const publicKey = keyPair.publicKey;
        console.log(`🔹 Our public key: ${publicKey.toString('hex')}`);
        
        // Try to sign inputs individually with better error handling
        let signedInputs = 0;
        for (let i = 0; i < psbt.inputCount; i++) {
            try {
                console.log(`🔹 Attempting to sign input ${i}`);
                
                // Get input details for debugging
                const input = psbt.data.inputs[i];
                console.log(`🔍 Input ${i} details:`, {
                    hasWitnessUtxo: !!input.witnessUtxo,
                    hasNonWitnessUtxo: !!input.nonWitnessUtxo,
                    hasRedeemScript: !!input.redeemScript,
                    hasWitnessScript: !!input.witnessScript
                });
                
                // Create a custom signer that properly handles Buffer conversion
                const customSigner = {
                    publicKey: keyPair.publicKey,
                    sign: (hash, lowR) => {
                        try {
                            // Ensure hash is a Buffer
                            const hashBuffer = hash instanceof Buffer ? hash : Buffer.from(hash);
                            
                            // Sign with the key pair
                            let signature = keyPair.sign(hashBuffer, lowR);
                            
                            // Convert signature to Buffer if it's Uint8Array
                            if (signature.constructor === Uint8Array || signature instanceof Uint8Array) {
                                signature = Buffer.from(signature);
                            }
                            
                            console.log(`🔹 Generated signature for input ${i}: ${signature.length} bytes`);
                            return signature;
                        } catch (signError) {
                            console.error(`❌ Custom signing failed: ${signError.message}`);
                            throw signError;
                        }
                    },
                    // Ensure publicKey is also a Buffer
                    get publicKey() {
                        const pubKey = keyPair.publicKey;
                        return pubKey instanceof Buffer ? pubKey : Buffer.from(pubKey);
                    }
                };
                
                // Method 1: Try with custom signer
                try {
                    psbt.signInput(i, customSigner);
                    // Check if signature was added
                    if (psbt.data.inputs[i].partialSig && psbt.data.inputs[i].partialSig.length > 0) {
                        signedInputs++;
                        console.log(`✅ Successfully signed input ${i} with custom signer`);
                        continue;
                    }
                } catch (customError) {
                    console.log(`⚠️ Custom signer failed for input ${i}: ${customError.message}`);
                }
                
                // Method 2: Try to fix the keypair and use standard signing
                try {
                    // Create a new keypair with explicit Buffer conversion
                    const fixedKeyPair = {
                        publicKey: Buffer.from(keyPair.publicKey),
                        privateKey: Buffer.from(keyPair.privateKey || keyPair.__D),
                        sign: (hash, lowR) => {
                            const hashBuffer = Buffer.from(hash);
                            let signature = keyPair.sign(hashBuffer, lowR);
                            return Buffer.from(signature);
                        },
                        verify: keyPair.verify.bind(keyPair)
                    };
                    
                    psbt.signInput(i, fixedKeyPair);
                    if (psbt.data.inputs[i].partialSig && psbt.data.inputs[i].partialSig.length > 0) {
                        signedInputs++;
                        console.log(`✅ Successfully signed input ${i} with fixed keypair`);
                        continue;
                    }
                } catch (fixedError) {
                    console.log(`⚠️ Fixed keypair signing failed for input ${i}: ${fixedError.message}`);
                }
                
                // Method 3: Try with explicit SIGHASH_ALL
                try {
                    psbt.signInput(i, customSigner, [bitcoin.Transaction.SIGHASH_ALL]);
                    if (psbt.data.inputs[i].partialSig && psbt.data.inputs[i].partialSig.length > 0) {
                        signedInputs++;
                        console.log(`✅ Successfully signed input ${i} with SIGHASH_ALL`);
                        continue;
                    }
                } catch (sighashError) {
                    console.log(`⚠️ SIGHASH_ALL signing failed for input ${i}: ${sighashError.message}`);
                }
            } catch (inputError) {
                console.log(`⚠️ Error processing input ${i}: ${inputError.message}`);
            }
        }
        
        console.log(`🔹 Successfully signed ${signedInputs} out of ${psbt.inputCount} inputs`);
        
        if (signedInputs === 0) {
            throw new Error(`No inputs could be signed with the provided private key. This may mean the private key doesn't match any of the PSBT inputs.`);
        }
        
        // Validate signatures
        try {
            const validated = psbt.validateSignaturesOfAllInputs();
            console.log(`🔹 Signature validation: ${validated}`);
        } catch (validationError) {
            console.log(`⚠️ Signature validation warning: ${validationError.message}`);
        }
        
        // Try to finalize inputs
        let finalizedInputs = 0;
        for (let i = 0; i < psbt.inputCount; i++) {
            try {
                psbt.finalizeInput(i);
                finalizedInputs++;
                console.log(`✅ Finalized input ${i}`);
            } catch (finalizeError) {
                console.log(`⚠️ Could not finalize input ${i}: ${finalizeError.message}`);
            }
        }
        
        console.log(`🔹 Finalized ${finalizedInputs} out of ${psbt.inputCount} inputs`);
        
        // Extract the transaction
        const tx = psbt.extractTransaction();
        
        // Get the raw transaction hex
        const txHex = tx.toHex();
        const txId = tx.getId();
        
        console.log(`🔹 Signed transaction ID: ${txId}`);
        console.log(`🔹 Transaction hex: ${txHex.substring(0, 100)}...`);
        
        // Broadcast the transaction to Bitcoin network
        console.log(`🚀 Broadcasting Bitcoin transaction to network...`);
        
        let broadcastResult = null;
        let broadcastError = null;
        
        try {
            broadcastResult = await broadcastBitcoinTransaction(txHex);
            console.log(`✅ Transaction broadcast successful:`, broadcastResult);
        } catch (error) {
            broadcastError = error;
            console.error(`❌ Transaction broadcast failed:`, error.message);
        }
        
        return {
            success: true,
            txHash: txId,
            rawTransaction: txHex,
            toAddress: toAddress,
            value: parseInt(value),
            network: 'bitcoin',
            status: broadcastResult ? 'broadcast' : 'signed_only',
            signedInputs: signedInputs,
            totalInputs: psbt.inputCount,
            finalizedInputs: finalizedInputs,
            broadcastResult: broadcastResult,
            broadcastError: broadcastError?.message,
            message: broadcastResult 
                ? `Bitcoin transaction broadcast successfully! TxID: ${txId}` 
                : `Bitcoin transaction signed but broadcast failed: ${broadcastError?.message || 'Unknown error'}. Transaction hex: ${txHex}`
        };

    } catch (error) {
        console.error(`❌ Bitcoin PSBT swap failed:`, error);
        
        // Re-throw the error to be handled by the main controller
        throw new Error(`Bitcoin PSBT swap failed: ${error.message}`);
    }
}

// =============================================================================
// TRON TRANSACTION HANDLER
// =============================================================================

async function executeTronSwap(privateKey, transactionRequest) {
    try {
        // Validate transaction request
        if (!transactionRequest.data) {
            throw new Error('Invalid TRON transaction request: missing "data" field');
        }

        console.log(`🔹 Executing TRON swap transaction`);

        // For TRON swaps, the transaction is typically pre-signed by LiFi
        // We need to broadcast the transaction to TRON network
        
        // TRON RPC endpoints with fallback
        const tronRPCs = [
            'https://api.trongrid.io',
            'https://api.tronstack.io',
            process.env.TRON_RPC || 'https://api.trongrid.io'
        ];

        let tronError = null;

        // Try broadcasting to TRON network
        for (let i = 0; i < tronRPCs.length; i++) {
            try {
                console.log(`🔗 Trying TRON RPC ${i + 1}/${tronRPCs.length}: ${tronRPCs[i]}`);
                
                // Deserialize the transaction data
                const transactionData = JSON.parse(Buffer.from(transactionRequest.data, 'base64').toString());
                
                // Broadcast transaction to TRON network
                const response = await fetch(`${tronRPCs[i]}/wallet/broadcasttransaction`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(transactionData)
                });

                const result = await response.json();
                
                if (result.result === true && result.txid) {
                    console.log(`✅ TRON transaction broadcasted: ${result.txid}`);
                    
                    return {
                        success: true,
                        txHash: result.txid,
                        network: 'tron',
                        status: 'pending',
                        message: 'TRON transaction broadcasted successfully'
                    };
                } else {
                    throw new Error(result.message || 'TRON broadcast failed');
                }
                
            } catch (error) {
                console.log(`❌ TRON RPC ${i + 1} failed: ${error.message}`);
                tronError = error;
                
                if (i === tronRPCs.length - 1) {
                    throw new Error(`All TRON RPC endpoints failed. Last error: ${tronError.message}`);
                }
                continue;
            }
        }

    } catch (error) {
        console.error(`❌ TRON swap failed:`, error);
        throw new Error(`TRON swap failed: ${error.message}`);
    }
}

// =============================================================================
// MAIN SWAP CONTROLLER
// =============================================================================

exports.executeSwap = async (req, res) => {
    try {
        const { fromCoin, privateKey, transactionRequest, user_id, slippage, approvalAddress, amount } = req.body;

        // Validate required fields
        if (!fromCoin || !privateKey || !transactionRequest || !amount) {
            return res.status(400).json({ 
                error: 'Missing required fields: fromCoin, privateKey, transactionRequest, amount' 
            });
        }

        // Set default slippage to 3% if not provided
        const slippagePercentage = slippage || 0.03;

        // Check if approval is required for USDT/USDC transactions
        const requiresApproval = ['USDT', 'USDC'].includes(fromCoin.toUpperCase());
        
        if (requiresApproval && !approvalAddress) {
            return res.status(400).json({
                error: `Approval address is required for ${fromCoin.toUpperCase()} transactions. Please provide approvalAddress from LiFi response.`
            });
        }

        console.log(`🚀 Starting cross-chain swap for ${fromCoin}`);
        console.log(`📊 Slippage tolerance: ${(slippagePercentage * 100).toFixed(2)}%`);
        if (requiresApproval) {
            console.log(`🔐 Approval address: ${approvalAddress}`);
        }
        console.log(`📄 Transaction request:`, JSON.stringify(transactionRequest, null, 2));

        let result;
        let networkName;

        // Determine the network based on the transaction request structure
        if (transactionRequest.to && transactionRequest.data && transactionRequest.chainId) {
            // EVM-based transaction (ETH, BNB, AVAX, etc.)
            networkName = CHAIN_ID_TO_NETWORK[transactionRequest.chainId];
            if (!networkName) {
                throw new Error(`Unsupported chain ID: ${transactionRequest.chainId}`);
            }

            // Handle token approval for USDT/USDC transactions
            if (requiresApproval && approvalAddress) {
                console.log(`🔐 Handling token approval for ${fromCoin.toUpperCase()}...`);
                
                // Get token contract address for the specific network
                const tokenContracts = {
                    ethereum: {
                        'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                        'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
                    },
                    bnb: {
                        'USDT': '0x55d398326f99059ff775485246999027b3197955',
                        'USDC': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'
                    },
                    avalanche: {
                        'USDT': '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
                        'USDC': '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
                    },
                    optimism: {
                        'USDT': '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
                        'USDC': '0x7f5c764cbc14f9669b88837ca1490cca17c31607'
                    },
                    arbitrum: {
                        'USDT': '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
                        'USDC': '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8'
                    }
                };

                const tokenAddress = tokenContracts[networkName]?.[fromCoin.toUpperCase()];
                if (tokenAddress) {
                    // Extract amount from transaction data or use a large approval amount
                    const approvalAmount = '1000000'; // 1M tokens approval (adjust as needed)
                    
                    try {
                        const approvalResult = await checkAndApproveToken(
                            privateKey, 
                            tokenAddress, 
                            approvalAddress, 
                            approvalAmount, 
                            networkName
                        );
                        console.log(`✅ Token approval completed:`, approvalResult);
                    } catch (approvalError) {
                        console.error(`❌ Token approval failed:`, approvalError);
                        return res.status(400).json({
                            error: `Token approval failed: ${approvalError.message}`,
                            details: 'Please check your token balance and try again'
                        });
                    }
                }
            }

            result = await executeEVMSwap(privateKey, transactionRequest, networkName);
            
        } else if (transactionRequest.to && transactionRequest.data && 
                   isBitcoinAddress(transactionRequest.to) && 
                   isPSBTData(transactionRequest.data)) {
            // Bitcoin PSBT transaction from LiFi - has 'to' (Bitcoin address), 'data' (PSBT hex), and 'value'
            console.log('🔹 Detected Bitcoin PSBT transaction from LiFi');
            result = await executeBitcoinPSBTSwap(privateKey, transactionRequest);
            
        } else if (transactionRequest.data && !transactionRequest.to) {
            // Solana or SUI - both use base64 data, determine by private key format or coin context
            const isSolanaPrivateKey = privateKey.length === 128; // Solana private keys are 64 bytes = 128 hex chars
            const isSUIPrivateKey = privateKey.startsWith('suiprivkey1') || privateKey.length === 64;
            const isTronPrivateKey = privateKey.length === 64 && !privateKey.startsWith('suiprivkey1') && !isSolanaPrivateKey;
            
            if (fromCoin.toUpperCase() === 'SOL' || fromCoin.includes('SOL') || 
                fromCoin.toUpperCase() === 'USDT' && isSolanaPrivateKey ||
                fromCoin.toUpperCase() === 'USDC' && isSolanaPrivateKey ||
                isSolanaPrivateKey) {
                result = await executeSolanaSwap(privateKey, transactionRequest);
            } else if (fromCoin.toUpperCase() === 'SUI' || isSUIPrivateKey) {
                result = await executeSUISwap(privateKey, transactionRequest);
            } else if (fromCoin.toUpperCase() === 'TRX' || 
                      (fromCoin.toUpperCase() === 'USDT' && isTronPrivateKey) ||
                      (fromCoin.toUpperCase() === 'USDC' && isTronPrivateKey)) {
                // TRON transaction - has data but different structure than Solana/SUI
                result = await executeTronSwap(privateKey, transactionRequest);
            } else {
                throw new Error(`Cannot determine network for coin: ${fromCoin}. Please check private key format or transaction structure.`);
            }
            
            
        } else if (transactionRequest.toAddress && transactionRequest.fromAmount) {
            // Bitcoin deposit transaction
            result = await executeBitcoinSwap(privateKey, transactionRequest);
            
        } else {
            throw new Error('Invalid transaction request format');
        }

        // Extract transaction details for better database logging
        let actualFromAddress = 'swap_transaction';
        let actualToAddress = 'swap_transaction';
        let transactionAmount = amount; // Use amount from request body

        // Extract address details from transaction request
        if (transactionRequest.from) {
            actualFromAddress = transactionRequest.from;
        }
        if (transactionRequest.to) {
            actualToAddress = transactionRequest.to;
        }

        // Save successful transaction to database
        if (result.success && !result.depositRequired) {
            try {
                await saveSwapTransaction(
                    result.txHash,
                    fromCoin,
                    'cross_chain_swap', // We know it's a cross-chain swap
                    transactionAmount,
                    null,
                    'success',
                    null,
                    user_id,
                    result.network,
                    result.blockNumber || null,
                    result.gasUsed || null,
                    actualFromAddress,
                    actualToAddress
                );
            } catch (dbError) {
                console.error('Failed to save successful swap transaction:', dbError);
            }
        }

        res.status(200).json({
            message: `Cross-chain swap executed successfully for ${fromCoin}`,
            success: true,
            fromCoin: fromCoin,
            network: result.network,
            ...result
        });

    } catch (error) {
        console.error('❌ Swap execution failed:', error);

        // Save failed transaction to database (matching sendTransaction.js pattern)
        try {
            // Extract transaction details for better logging (same as success case)
            let actualFromAddress = 'swap_transaction';
            let actualToAddress = 'swap_transaction';
            let transactionAmount = req.body.amount || '0'; // Use amount from request body

            if (req.body.transactionRequest) {
                if (req.body.transactionRequest.from) {
                    actualFromAddress = req.body.transactionRequest.from;
                }
                if (req.body.transactionRequest.to) {
                    actualToAddress = req.body.transactionRequest.to;
                }
            }

            await saveSwapTransaction(
                'failed_swap_' + Date.now(),
                req.body.fromCoin || 'unknown_token',
                'cross_chain_swap',
                transactionAmount,
                null,
                'failed',
                error.message,
                req.body.user_id,
                'cross_chain_swap',
                null,
                null,
                actualFromAddress,
                actualToAddress
            );
        } catch (dbError) {
            console.error('Failed to save failed swap transaction:', dbError);
        }

        res.status(500).json({
            error: error.message,
            success: false,
            fromCoin: req.body.fromCoin
        });
    }
};

// =============================================================================
// GET SWAP STATUS WITH BLOCKCHAIN CONFIRMATION (Enhanced utility endpoint)
// =============================================================================

exports.getSwapStatus = async (req, res) => {
    try {
        const { txHash } = req.params;
        
        // Find the swap transaction in database
        const swapTransaction = await TransactionModel.findOne({ 
            txHash: txHash,
            network: { $in: ['cross_chain_swap', 'ethereum', 'bnb', 'avalanche', 'optimism', 'arbitrum', 'solana', 'sui', 'bitcoin'] }
        });

        if (!swapTransaction) {
            return res.status(404).json({ 
                error: 'Swap transaction not found',
                txHash: txHash
            });
        }

        let blockchainStatus = null;

        // Check blockchain status for EVM transactions
        if (swapTransaction.status === 'pending' && txHash.startsWith('0x')) {
            try {
                // Determine network from transaction details
                let networkName = 'ethereum'; // default
                if (swapTransaction.network !== 'cross_chain_swap') {
                    networkName = swapTransaction.network;
                }

                const provider = await getProviderWithFallback(networkName);
                const receipt = await provider.getTransactionReceipt(txHash);
                
                if (receipt) {
                    blockchainStatus = {
                        confirmed: true,
                        blockNumber: receipt.blockNumber,
                        gasUsed: receipt.gasUsed.toString(),
                        status: receipt.status === 1 ? 'success' : 'failed'
                    };

                    // Update database with confirmed status
                    await TransactionModel.updateOne(
                        { txHash: txHash },
                        { 
                            status: blockchainStatus.status,
                            blockNumber: receipt.blockNumber,
                            gasUsed: receipt.gasUsed.toString()
                        }
                    );
                } else {
                    blockchainStatus = {
                        confirmed: false,
                        message: 'Transaction still pending on blockchain'
                    };
                }
            } catch (error) {
                console.error('Error checking blockchain status:', error);
                blockchainStatus = {
                    error: 'Could not verify blockchain status',
                    message: error.message
                };
            }
        }

        res.status(200).json({
            message: 'Swap status retrieved successfully',
            transaction: swapTransaction,
            blockchainStatus: blockchainStatus
        });

    } catch (error) {
        console.error('Error fetching swap status:', error);
        res.status(500).json({ 
            error: error.message 
        });
    }
};
