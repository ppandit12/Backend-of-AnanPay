# Send Transaction API Documentation

This document contains all the available transaction endpoints and their required payloads for the Crypto Wallet Backend API.

## Base URL
```
http://localhost:3000/api/transactions
```

## Table of Contents
1. [EVM Chain Routes](#evm-chain-routes)
2. [ERC-20 Token Routes](#erc-20-token-routes)
3. [Multi-Chain Stablecoin Routes](#multi-chain-stablecoin-routes)
4. [Non-EVM Chain Routes](#non-evm-chain-routes)
5. [Utility Routes](#utility-routes)

---

## EVM Chain Routes

### 1. Ethereum Transaction
**Endpoint:** `POST /send-ethereum`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "0.1"
}
```

### 2. BNB Chain Transaction
**Endpoint:** `POST /send-bnb`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "0.1"
}
```

### 3. Avalanche Transaction
**Endpoint:** `POST /send-avalanche`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "0.1"
}
```

### 4. Optimism Transaction
**Endpoint:** `POST /send-optimism`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "0.1"
}
```

### 5. Arbitrum Transaction
**Endpoint:** `POST /send-arbitrum`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "0.1"
}
```

---

## ERC-20 Token Routes

### 1. Chainlink (LINK) Token Transaction
**Endpoint:** `POST /send-chainlink`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "10.5",
  "network": "ethereum"
}
```

### 2. AAVE Token Transaction
**Endpoint:** `POST /send-aave`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "5.25",
  "network": "ethereum"
}
```

### 3. UNI Token Transaction
**Endpoint:** `POST /send-uni`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "100",
  "network": "ethereum"
}
```

---

## Multi-Chain Stablecoin Routes

### USDT Transactions

#### 1. USDT on Ethereum
**Endpoint:** `POST /send-usdt-ethereum`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "100.50",
  "network": "ethereum"
}
```

#### 2. USDT on BNB Chain
**Endpoint:** `POST /send-usdt-bnb`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "100.50",
  "network": "bnb"
}
```

#### 3. USDT on Avalanche
**Endpoint:** `POST /send-usdt-avalanche`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "100.50",
  "network": "avalanche"
}
```

#### 4. USDT on Optimism
**Endpoint:** `POST /send-usdt-optimism`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "100.50",
  "network": "optimism"
}
```

#### 5. USDT on Arbitrum
**Endpoint:** `POST /send-usdt-arbitrum`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "100.50",
  "network": "arbitrum"
}
```

#### 6. USDT on TRON
**Endpoint:** `POST /send-usdt-tron`

**Payload:**
```json
{
  "fromAddress": "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  "privateKey": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
  "amount": "100.50",
  "network": "tron"
}
```

#### 7. USDT on Solana
**Endpoint:** `POST /send-usdt-solana`

**Payload:**
```json
{
  "fromAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "privateKey": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "7dHbWXmci3dT6jH3RHUKT2Ww5phfePEm1VCa9AaKXkPe",
  "amount": "100.50",
  "network": "solana"
}
```

#### 8. Generic USDT (Network in Body)
**Endpoint:** `POST /send-usdt`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "100.50",
  "network": "ethereum"
}
```

### USDC Transactions

#### 1. USDC on Ethereum
**Endpoint:** `POST /send-usdc-ethereum`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "50.25",
  "network": "ethereum"
}
```

#### 2. USDC on BNB Chain
**Endpoint:** `POST /send-usdc-bnb`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "50.25",
  "network": "bnb"
}
```

#### 3. USDC on Avalanche
**Endpoint:** `POST /send-usdc-avalanche`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "50.25",
  "network": "avalanche"
}
```

#### 4. USDC on Optimism
**Endpoint:** `POST /send-usdc-optimism`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "50.25",
  "network": "optimism"
}
```

#### 5. USDC on Arbitrum
**Endpoint:** `POST /send-usdc-arbitrum`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "50.25",
  "network": "arbitrum"
}
```

#### 6. USDC on TRON
**Endpoint:** `POST /send-usdc-tron`

**Payload:**
```json
{
  "fromAddress": "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  "privateKey": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
  "amount": "50.25",
  "network": "tron"
}
```

#### 7. USDC on Solana
**Endpoint:** `POST /send-usdc-solana`

**Payload:**
```json
{
  "fromAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "privateKey": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "7dHbWXmci3dT6jH3RHUKT2Ww5phfePEm1VCa9AaKXkPe",
  "amount": "50.25",
  "network": "solana"
}
```

#### 8. Generic USDC (Network in Body)
**Endpoint:** `POST /send-usdc`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "privateKey": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "0x0987654321fedcba0987654321fedcba09876543",
  "amount": "50.25",
  "network": "ethereum"
}
```

---

## Non-EVM Chain Routes

### 1. Bitcoin Transaction
**Endpoint:** `POST /send-bitcoin`

**Payload:**
```json
{
  "fromAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "privateKey": "L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ",
  "toAddress": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
  "amount": "0.001",
  "feeRate": 10
}
```

### 2. Litecoin Transaction
**Endpoint:** `POST /send-litecoin`

**Payload:**
```json
{
  "fromAddress": "ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7kw5rljs90",
  "privateKey": "T7qQf4Z2q4qJp3q7q4qJp3q7q4qJp3q7q4qJp3q7q4qJp3q7",
  "toAddress": "LdP8Qox1VAhCzLJNqrr74YovaWYyNSTLKM",
  "amount": "0.1",
  "feeRate": 10
}
```

### 3. Solana Transaction
**Endpoint:** `POST /send-solana`

**Payload:**
```json
{
  "fromAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "privateKey": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "7dHbWXmci3dT6jH3RHUKT2Ww5phfePEm1VCa9AaKXkPe",
  "amount": "0.5"
}
```

### 4. XRP Transaction
**Endpoint:** `POST /send-xrp`

**Payload:**
```json
{
  "fromAddress": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
  "privateKey": "sEdTM1uX8pu2do5XvTnutH6HsouMaM2",
  "toAddress": "rUn84CJzdHmV3QpNfkp6dbxBaM5sBLrqzQ",
  "amount": "10"
}
```

### 5. TRON Transaction
**Endpoint:** `POST /send-tron`

**Payload:**
```json
{
  "fromAddress": "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  "privateKey": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "toAddress": "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
  "amount": "100"
}
```

### 6. Cardano Transaction
**Endpoint:** `POST /send-cardano`

**Payload:**
```json
{
  "fromAddress": "addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfx01ahx6kmw3y8d",
  "privateKey": "ed25519_sk1xy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfx01ahx6kmw3y8d",
  "toAddress": "addr1qyx2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfx01ahx6kmw3y8d",
  "amount": "10"
}
```

### 7. SUI Transaction
**Endpoint:** `POST /send-sui`

**Payload:**
```json
{
  "fromAddress": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "privateKey": "suiprivkey1qyx2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfx01ahx6kmw3y8d",
  "toAddress": "0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba",
  "amount": "1.5"
}
```

---

## Utility Routes

### 1. Get Supported Networks for Token
**Endpoint:** `GET /supported-networks/:token`

**Example:** `GET /supported-networks/usdt`

**Response:**
```json
{
  "token": "usdt",
  "supportedNetworks": ["ethereum", "bnb", "avalanche", "optimism", "arbitrum", "tron", "solana"]
}
```

### 2. Get All Available Endpoints
**Endpoint:** `GET /endpoints`

**Response:**
```json
{
  "nativeTokens": {
    "ethereum": "/api/transactions/send-ethereum",
    "bnb": "/api/transactions/send-bnb",
    "avalanche": "/api/transactions/send-avalanche",
    "optimism": "/api/transactions/send-optimism",
    "arbitrum": "/api/transactions/send-arbitrum",
    "bitcoin": "/api/transactions/send-bitcoin",
    "litecoin": "/api/transactions/send-litecoin",
    "solana": "/api/transactions/send-solana",
    "xrp": "/api/transactions/send-xrp",
    "tron": "/api/transactions/send-tron",
    "cardano": "/api/transactions/send-cardano",
    "sui": "/api/transactions/send-sui"
  },
  "erc20Tokens": {
    "chainlink": "/api/transactions/send-chainlink",
    "aave": "/api/transactions/send-aave",
    "uni": "/api/transactions/send-uni"
  },
  "stablecoins": {
    "usdt": {
      "ethereum": "/api/transactions/send-usdt-ethereum",
      "bnb": "/api/transactions/send-usdt-bnb",
      "avalanche": "/api/transactions/send-usdt-avalanche",
      "optimism": "/api/transactions/send-usdt-optimism",
      "arbitrum": "/api/transactions/send-usdt-arbitrum",
      "tron": "/api/transactions/send-usdt-tron",
      "solana": "/api/transactions/send-usdt-solana",
      "generic": "/api/transactions/send-usdt"
    },
    "usdc": {
      "ethereum": "/api/transactions/send-usdc-ethereum",
      "bnb": "/api/transactions/send-usdc-bnb",
      "avalanche": "/api/transactions/send-usdc-avalanche",
      "optimism": "/api/transactions/send-usdc-optimism",
      "arbitrum": "/api/transactions/send-usdc-arbitrum",
      "tron": "/api/transactions/send-usdc-tron",
      "solana": "/api/transactions/send-usdc-solana",
      "generic": "/api/transactions/send-usdc"
    }
  },
  "utilities": {
    "supportedNetworks": "/api/transactions/supported-networks/:token",
    "endpoints": "/api/transactions/endpoints"
  }
}
```

---

## Common Response Format

### Success Response
```json
{
  "message": "Transaction successful",
  "success": true,
  "txHash": "0x1234567890abcdef...",
  "blockNumber": 12345678,
  "gasUsed": "21000",
  "network": "ethereum"
}
```

### Error Response
```json
{
  "error": "Error message describing what went wrong"
}
```

---

## Notes

1. **Private Keys**: Always keep private keys secure and never expose them in logs or client-side code.

2. **Amount Format**: 
   - For most tokens: Use decimal format (e.g., "0.1", "100.50")
   - For Bitcoin: Amount in BTC (e.g., "0.001" = 0.001 BTC)
   - For Solana: Amount in SOL (e.g., "0.5" = 0.5 SOL)

3. **Address Formats**:
   - EVM chains: Hexadecimal format starting with `0x`
   - Bitcoin: Legacy, SegWit, or Bech32 formats
   - Solana: Base58 encoded addresses
   - TRON: Base58 encoded addresses starting with `T`
   - XRP: Classic address format starting with `r`
   - Cardano: Bech32 format starting with `addr1`
   - SUI: Hexadecimal format starting with `0x`

4. **Network Parameter**: For multi-chain tokens (USDT, USDC), the `network` parameter specifies which blockchain to use.

5. **Fee Parameters**: Some chains like Bitcoin and Litecoin accept optional `feeRate` parameters to control transaction fees.

6. **All endpoints require POST requests with JSON payloads unless specified otherwise (utility routes use GET).**