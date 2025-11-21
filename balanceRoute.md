# Balance API Documentation

This document contains the balance endpoint and payload information for the Crypto Wallet Backend API.

## Base URL
```
http://localhost:3000/api/balance
```

---

## Get All Balances

**Endpoint:** `POST /balance`

**Description:** Fetches all cryptocurrency balances for a registered user across multiple blockchains.

**Payload:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "balances": {
    "ethereum": "1.2345",
    "bnb": "0.8765",
    "avax": "10.5432",
    "optimism": "0.1234",
    "arbitrum": "2.3456",
    "usdt_ethereum": "500.75",
    "usdc_ethereum": "250.50",
    "usdt_bnb": "300.25",
    "usdc_bnb": "150.00",
    "usdt_avalanche": "200.00",
    "usdc_avalanche": "100.00",
    "usdt_optimism": "75.50",
    "usdc_optimism": "50.25",
    "usdt_arbitrum": "125.75",
    "usdc_arbitrum": "80.00",
    "link": "50.123",
    "aave": "25.456",
    "uni": "100.789",
    "bitcoin": "0.05432",
    "litecoin": "1.2345",
    "solana": "15.6789",
    "usdt_solana": "400.00",
    "usdc_solana": "200.00",
    "xrp": "1000.50",
    "tron": "5000.25",
    "usdt_tron": "600.75",
    "usdc_tron": "300.50",
    "sui": "100.123",
    "cardano": "500.456"
  }
}
```

---

## Supported Cryptocurrencies

The API fetches balances for the following cryptocurrencies:

### Native Tokens
- **ethereum**: Ethereum (ETH)
- **bnb**: Binance Coin (BNB) 
- **avax**: Avalanche (AVAX)
- **optimism**: Optimism (OP)
- **arbitrum**: Arbitrum (ARB)
- **bitcoin**: Bitcoin (BTC)
- **litecoin**: Litecoin (LTC)
- **solana**: Solana (SOL)
- **xrp**: XRP (XRP)
- **tron**: TRON (TRX)
- **sui**: SUI (SUI)
- **cardano**: Cardano (ADA)

### ERC-20 Tokens
- **link**: Chainlink (LINK) on Ethereum
- **aave**: AAVE (AAVE) on Ethereum
- **uni**: Uniswap (UNI) on Ethereum

### Multi-Chain Stablecoins

#### USDT (Tether)
- **usdt_ethereum**: USDT on Ethereum
- **usdt_bnb**: USDT on BNB Chain
- **usdt_avalanche**: USDT on Avalanche
- **usdt_optimism**: USDT on Optimism
- **usdt_arbitrum**: USDT on Arbitrum
- **usdt_solana**: USDT on Solana
- **usdt_tron**: USDT on TRON

#### USDC (USD Coin)
- **usdc_ethereum**: USDC on Ethereum
- **usdc_bnb**: USDC on BNB Chain
- **usdc_avalanche**: USDC on Avalanche
- **usdc_optimism**: USDC on Optimism
- **usdc_arbitrum**: USDC on Arbitrum
- **usdc_solana**: USDC on Solana
- **usdc_tron**: USDC on TRON

---

## Error Response

**Error Response:**
```json
{
  "msg": "User not found or wallets missing"
}
```

**Server Error Response:**
```json
{
  "msg": "Balance fetch error",
  "error": "Error message describing what went wrong"
}
```

---

## Notes

1. **User Registration Required**: The user must be registered and have wallet addresses stored in the database.

2. **Balance Format**: All balances are returned as string values representing the amount in the native token/coin unit.

3. **Zero Balances**: If a wallet doesn't exist or has no balance, it may not appear in the response or return "0.0".

4. **Network Dependencies**: Balance fetching depends on external APIs and RPC endpoints. Some balances may fail to fetch due to network issues.

5. **Timeout Handling**: Requests have a 10-second timeout to prevent hanging requests.

6. **Retry Logic**: Failed requests are automatically retried up to 3 times with exponential backoff.

7. **Address Validation**: Invalid addresses will result in zero balance or may cause the request to fail for that specific cryptocurrency.