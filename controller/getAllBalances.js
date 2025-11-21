const { RegisteruserModel } = require('../models/RegisterUser');
const { ethers } = require('ethers');
const { Connection, PublicKey } = require('@solana/web3.js');
const xrpl = require('xrpl');
const TronWeb = require('tronweb');
const axios = require('axios');

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

const RPC_URLS = {
    ethereum: 'https://eth.llamarpc.com',
    bnb: 'https://bsc-dataseed.binance.org',
    avax: 'https://api.avax.network/ext/bc/C/rpc',
    optimism: 'https://mainnet.optimism.io',
    arbitrum: 'https://arb1.arbitrum.io/rpc'
};

const ERC20_CONTRACTS = {
    usdt_ethereum: {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        rpc: RPC_URLS.ethereum
    },
    usdc_ethereum: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        rpc: RPC_URLS.ethereum
    },
    usdt_bnb: { 
        address: '0x55d398326f99059fF775485246999027B3197955', 
        rpc: RPC_URLS.bnb 
    },
    usdc_bnb: { 
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 
        rpc: RPC_URLS.bnb 
    },
    usdt_avalanche: { 
        address: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', 
        rpc: RPC_URLS.avax 
    },
    usdc_avalanche: { 
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 
        rpc: RPC_URLS.avax 
    },
    usdt_optimism: { 
        address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', 
        rpc: RPC_URLS.optimism 
    },
    usdc_optimism: { 
        address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607', 
        rpc: RPC_URLS.optimism 
    },
    usdt_arbitrum: { 
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', 
        rpc: RPC_URLS.arbitrum 
    },
    usdc_arbitrum: { 
        address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', 
        rpc: RPC_URLS.arbitrum 
    },
    link: {
        address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        rpc: RPC_URLS.ethereum
    },
    aave: {
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        rpc: RPC_URLS.ethereum
    },
    uni: {
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        rpc: RPC_URLS.ethereum
    }
};

const TRC20_CONTRACTS = {
    usdt_tron: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    usdc_tron: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8'
};

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { 'TRON-PRO-API-KEY': '8c4d5a5b-965d-4a98-88b6-f04fd1414970' }
});
const solanaConnection = new Connection('https://api.mainnet-beta.solana.com');
const xrpClient = new xrpl.Client('wss://s1.ripple.com');

// Timeout and retry helper
const withTimeout = (promise, timeoutMs) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
        })
    ]);
};

async function retryOperation(operation, maxAttempts = 3, delayMs = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await withTimeout(operation(), 10000);
        } catch (error) {
            if (attempt === maxAttempts) throw error;
            console.warn(`Attempt ${attempt} failed, retrying after ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

async function getEvmNativeBalance(address, rpcUrl) {
    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const balance = await withTimeout(provider.getBalance(address), 10000);
        return ethers.formatEther(balance);
    } catch (error) {
        console.warn(`Failed to fetch EVM balance for ${rpcUrl}: ${error.message}`);
        return '0.0';
    }
}

async function getErc20Balance(address, contractAddress, rpcUrl) {
    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const checksummedContractAddress = ethers.getAddress(contractAddress);
        const contract = new ethers.Contract(checksummedContractAddress, ERC20_ABI, provider);
        const decimals = await withTimeout(contract.decimals(), 10000);
        const checksummedAddress = ethers.getAddress(address);
        const balance = await withTimeout(contract.balanceOf(checksummedAddress), 10000);
        return ethers.formatUnits(balance, decimals);
    } catch (error) {
        console.warn(`Failed to fetch ERC-20 balance for contract ${contractAddress}: ${error.message}`);
        return '0.0';
    }
}

async function getBitcoinBalance(address) {
    const apis = [
        `https://blockchain.info/rawaddr/${address}?cors=true`,
        `https://blockstream.info/api/address/${address}`,
        `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`
    ];
    
    for (const url of apis) {
        try {
            const res = await withTimeout(axios.get(url), 10000);
            if (url.includes('blockstream')) {
                return res.data.chain_stats.funded_txo_sum / 1e8;
            } else if (url.includes('blockcypher')) {
                return res.data.balance / 1e8;
            } else {
                return res.data.final_balance / 1e8;
            }
        } catch (error) {
            console.warn(`Bitcoin API failed ${url}: ${error.message}`);
            continue;
        }
    }
    return 0;
}

async function getLitecoinBalance(address) {
    const apis = [
        `https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`,
        `https://blockstream.info/litecoin/api/address/${address}`,
        `https://ltc.bitaps.com/api/address/${address}`
    ];
    
    for (const url of apis) {
        try {
            const res = await withTimeout(axios.get(url), 10000);
            if (url.includes('blockstream')) {
                return res.data.chain_stats.funded_txo_sum / 1e8;
            } else if (url.includes('bitaps')) {
                return res.data.data.balance / 1e8;
            } else {
                return res.data.final_balance / 1e8;
            }
        } catch (error) {
            console.warn(`Litecoin API failed ${url}: ${error.message}`);
            continue;
        }
    }
    return 0;
}

async function getSolanaBalance(address) {
    try {
        const balanceLamports = await withTimeout(solanaConnection.getBalance(new PublicKey(address)), 10000);
        return balanceLamports / 1e9;
    } catch (error) {
        console.warn(`Failed to fetch Solana balance for ${address}: ${error.message}`);
        return 0;
    }
}

async function getSolanaTokenBalance(address, mintAddress) {
    try {
        const parsed = await withTimeout(
            solanaConnection.getParsedTokenAccountsByOwner(new PublicKey(address), { mint: new PublicKey(mintAddress) }),
            10000
        );
        let balance = 0;
        parsed.value.forEach((account) => {
            balance += parseFloat(account.account.data.parsed.info.tokenAmount.uiAmountString);
        });
        return balance;
    } catch (error) {
        console.warn(`Failed to fetch Solana token balance for mint ${mintAddress}: ${error.message}`);
        return 0;
    }
}

async function getXrpBalance(address) {
    try {
        await xrpClient.connect();
        const response = await withTimeout(
            xrpClient.request({ command: 'account_info', account: address }),
            10000
        );
        await xrpClient.disconnect();
        return response.result.account_data.Balance / 1e6;
    } catch (error) {
        await xrpClient.disconnect();
        if (error.data?.error === 'actNotFound') {
            console.warn(`XRP account not found for address ${address}`);
            return 0;
        }
        console.warn(`Failed to fetch XRP balance for ${address}: ${error.message}`);
        return 0;
    }
}

async function getTronNativeBalance(address) {
    try {
        if (!tronWeb.isAddress(address)) {
            console.warn(`Invalid Tron address: ${address}`);
            return 0;
        }
        const account = await retryOperation(() => tronWeb.trx.getAccount(address));
        if (!account || !account.address) {
            console.warn(`Tron address ${address} is not activated on the Tron blockchain`);
            return 0;
        }
        const balance = await retryOperation(() => tronWeb.trx.getBalance(address));
        console.log(`Tron native balance for ${address}: ${balance}`);
        return balance / 1e6;
    } catch (error) {
        console.warn(`Failed to fetch Tron native balance for ${address}: ${error.message || 'Unknown error'}`, error);
        return 0;
    }
}

async function getTrc20Balance(address, contractAddress) {
    try {
        console.log(`Fetching TRC-20 balance for address: ${address}, contract: ${contractAddress}`);
        if (!tronWeb.isAddress(contractAddress)) {
            console.warn(`Invalid Tron contract address: ${contractAddress}`);
            return 0;
        }
        if (!tronWeb.isAddress(address)) {
            console.warn(`Invalid Tron user address: ${address}`);
            return 0;
        }
        const account = await retryOperation(() => tronWeb.trx.getAccount(address));
        if (!account || !account.address) {
            console.warn(`Tron address ${address} is not activated on the Tron blockchain; cannot fetch TRC-20 balance`);
            return 0;
        }
        const hexAddress = tronWeb.address.toHex(address);
        console.log(`Converted address to hex: ${hexAddress}`);
        const contract = await retryOperation(() => tronWeb.contract().at(contractAddress));
        const balance = await retryOperation(() => contract.balanceOf(address).call({ from: address }));
        console.log(`TRC-20 balance for ${contractAddress}: ${balance.toString()}`);
        return Number(balance) / 1e6;
    } catch (error) {
        console.warn(`Failed to fetch TRC-20 balance for contract ${contractAddress}: ${error.message || 'Unknown error'}`, error);
        return 0;
    }
}

// NEW: SUI balance function
async function getSuiBalance(address) {
    try {
        const url = 'https://fullnode.mainnet.sui.io:443';
        const response = await withTimeout(
            axios.post(url, {
                jsonrpc: '2.0',
                id: 1,
                method: 'suix_getBalance',
                params: [address]
            }),
            10000
        );
        
        if (response.data.result) {
            return parseFloat(response.data.result.totalBalance) / 1e9; // SUI has 9 decimals
        }
        return 0;
    } catch (error) {
        console.warn(`Failed to fetch SUI balance for ${address}: ${error.message}`);
        return 0;
    }
}

// NEW: Cardano balance function
async function getCardanoBalance(address) {
    const apis = [
        {
            name: 'blockfrost',
            url: `https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`,
            headers: { 'project_id': 'mainnetkVsTQFg35CW1FOJT30nfiDY8lTV5V68u' }
        },
        {
            name: 'koios',
            url: `https://api.koios.rest/api/v1/address_info`,
            method: 'POST',
            data: { "_addresses": [address] }
        },
        {
            name: 'cardanoscan',
            url: `https://api.cardanoscan.io/api/v1/address/${address}`
        }
    ];
    
    for (const api of apis) {
        try {
            let response;
            if (api.method === 'POST') {
                response = await withTimeout(
                    axios.post(api.url, api.data, { headers: { 'Content-Type': 'application/json' } }),
                    15000
                );
            } else {
                response = await withTimeout(
                    axios.get(api.url, { headers: api.headers || {} }),
                    10000
                );
            }
            
            if (api.name === 'blockfrost' && response.data?.amount) {
                const lovelaceAmount = response.data.amount.find(asset => asset.unit === 'lovelace');
                return lovelaceAmount ? parseFloat(lovelaceAmount.quantity) / 1e6 : 0;
            } else if (api.name === 'koios' && response.data?.[0]?.balance) {
                return parseFloat(response.data[0].balance) / 1e6;
            } else if (api.name === 'cardanoscan' && response.data?.balance) {
                return parseFloat(response.data.balance) / 1e6;
            }
        } catch (error) {
            console.warn(`Cardano API failed ${api.name}: ${error.message}`);
            continue;
        }
    }
    return 0;
}

exports.getAllBalances = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await RegisteruserModel.findOne({ email }).lean();
        if (!user || !user.wallets) return res.status(404).json({ msg: 'User not found or wallets missing' });

        console.log('User wallets:', JSON.stringify(user.wallets, null, 2));

        const result = {};

        // Native tokens on EVM
        for (const chain of ['ethereum', 'bnb', 'avax', 'optimism', 'arbitrum']) {
            if (user.wallets[chain]) {
                result[chain] = await getEvmNativeBalance(user.wallets[chain].address, RPC_URLS[chain]);
            }
        }

        // ERC20 tokens - check each token directly
        for (const token in ERC20_CONTRACTS) {
            if (user.wallets[token]) {
                result[token] = await getErc20Balance(
                    user.wallets[token].address,
                    ERC20_CONTRACTS[token].address,
                    ERC20_CONTRACTS[token].rpc
                );
            }
        }

        // Handle legacy token names (chainlink -> link, etc.)
        if (user.wallets.chainlink && !result.link) {
            result.link = await getErc20Balance(
                user.wallets.chainlink.address,
                ERC20_CONTRACTS.link.address,
                ERC20_CONTRACTS.link.rpc
            );
        }

        // Bitcoin
        if (user.wallets.bitcoin) {
            result.bitcoin = await getBitcoinBalance(user.wallets.bitcoin.address);
        }

        // Litecoin
        if (user.wallets.litecoin) {
            result.litecoin = await getLitecoinBalance(user.wallets.litecoin.address);
        }

        // Solana
        if (user.wallets.solana) {
            result.solana = await getSolanaBalance(user.wallets.solana.address);
            
            // Also check for USDT and USDC tokens using the same Solana address
            // if specific usdt_solana/usdc_solana wallets don't exist
            if (!user.wallets.usdt_solana) {
                result.usdt_solana = await getSolanaTokenBalance(
                    user.wallets.solana.address,
                    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
                );
            }
            if (!user.wallets.usdc_solana) {
                result.usdc_solana = await getSolanaTokenBalance(
                    user.wallets.solana.address,
                    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
                );
            }
        }
        
        // USDT Solana (specific wallet configuration)
        if (user.wallets.usdt_solana) {
            result.usdt_solana = await getSolanaTokenBalance(
                user.wallets.usdt_solana.address,
                'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
            );
        }
        
        // USDC Solana (specific wallet configuration)
        if (user.wallets.usdc_solana) {
            result.usdc_solana = await getSolanaTokenBalance(
                user.wallets.usdc_solana.address,
                'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
            );
        }

        // XRP
        if (user.wallets.xrp) {
            result.xrp = await getXrpBalance(user.wallets.xrp.address);
        }

        // TRON
        if (user.wallets.tron) {
            result.tron = await getTronNativeBalance(user.wallets.tron.address);
        }
        // USDT Tron
        if (user.wallets.usdt_tron) {
            result.usdt_tron = await getTrc20Balance(
                user.wallets.usdt_tron.address,
                user.wallets.usdt_tron.contractAddress || TRC20_CONTRACTS.usdt_tron
            );
        }
        // USDC Tron
        if (user.wallets.usdc_tron) {
            result.usdc_tron = await getTrc20Balance(
                user.wallets.usdc_tron.address,
                user.wallets.usdc_tron.contractAddress || TRC20_CONTRACTS.usdc_tron
            );
        }

        // SUI
        if (user.wallets.sui) {
            result.sui = await getSuiBalance(user.wallets.sui.address);
        }

        // Cardano
        if (user.wallets.cardano) {
            result.cardano = await getCardanoBalance(user.wallets.cardano.address);
        }

        res.json({ balances: result });

    } catch (err) {
        console.error('Balance fetch error:', err);
        res.status(500).json({ msg: 'Balance fetch error', error: err.message });
    }
};