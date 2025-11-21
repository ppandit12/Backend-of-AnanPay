# Cross-Chain Swap Controller

This controller handles cross-chain cryptocurrency swaps using LiFi integration.

## API Endpoint

**POST** `http://localhost:9876/api/swap/execute`

## Request Payload

```json
{
  "fromCoin": "USDT",
  "privateKey": "user_private_key_hex",
  "user_id": "68b5412766fc8ac59bb98103",
  "amount": "0.09",
  "approvalAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  "transactionRequest": {} // LiFi transaction request object
}
```

## Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fromCoin` | string | ✅ | Source cryptocurrency (ETH, SOL, SUI, BTC, USDT, etc.) |
| `privateKey` | string | ✅ | Private key to sign the transaction |
| `user_id` | string | ❓ | Optional: User ID for transaction tracking |
| `amount` | string | ✅ | Amount to swap in the source cryptocurrency |
| `approvalAddress` | string | ✅ | Contract address for token approval (EVM chains) |
| `transactionRequest` | object | ✅ | LiFi API response transaction object |

## Transaction Request Types

### 🔹 **EVM Chains (ETH, BNB, AVAX, etc.)**

```json
{
  "fromCoin": "USDT",
  "privateKey": "your_avalanche_private_key",
  "user_id": "68b5412766fc8ac59bb98103",
  "amount": "0.09",
  "approvalAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  "transactionRequest": {
    "to": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
    "data": "0xa9059cbb000000000000000000000000...",
    "value": "0x0",
    "gasPrice": "0x17d78400",
    "gasLimit": "0x493e0",
    "chainId": 43114
  }
}
```

### 🔹 **Solana**

```json
{
  "fromCoin": "SOL",
  "privateKey": "dcf99da460115d93db133fd13ee45e1d4cacde291eff1f51e43c06186bc218c4...",
  "user_id": "68b5412766fc8ac59bb98103",
  "amount": "0.5",
  "approvalAddress": "N/A",
  "transactionRequest": {
    "data": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAGCcYMUJHytZHLILOVHvF+B8YA9qGTWSFFEqzrM+VvVjSbHoxPq4mUSUyPHlwSh0RbKRfWDEPHmqlZFi9dYABZjTIKI/NO/NLZ8aID4MZaKz1jVwknx2G8Vej5f1EA4avlaAMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAKD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FUGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAI4pzeE14U/L4hY61x9yIQJ9d1+DAenSl4zEWd+wsnQrAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADe2RMxGvk9Wc9c3vEcJtQnIrM8lUORnUnwyPYhg6ITdOVXu79hjTCp68tryQTSyMpw3aem2fWVgZj+Tkprd5CkBQMABQLAJwkAAwAJA/9DDwAAAAAABAIFBgkA5ydNdw+LXQAHAgABDAIAAACgJSYAAAAAAAgDAAcCNvIjxolS4fK2YKR0OwAAAAABAAAA/wAAAAAAAAAAAAAAAAAgX9F4fv/HQdf3vXqI9ZDL0LySpQA="
  }
}
```

### 🔹 **SUI**

```json
{
  "fromCoin": "SUI",
  "privateKey": "suiprivkey1qpwrcs7ku9pn5k6l5zm6tqjme3mvjsxmf8wv8h4nq2k5q5jm7p8m2m7",
  "user_id": "68b5412766fc8ac59bb98103",
  "amount": "1.0",
  "approvalAddress": "N/A",
  "transactionRequest": {
    "data": "BASE64_SUI_TRANSACTION_DATA"
  }
}
```

### 🔹 **Bitcoin**

```json
{
  "fromCoin": "BTC",
  "privateKey": "bitcoin_private_key_wif",
  "user_id": "68b5412766fc8ac59bb98103",
  "amount": "0.003",
  "approvalAddress": "N/A",
  "transactionRequest": {
    "toAddress": "bc1qbridgeDeposit...",
    "fromAmount": "300000",
    "memo": "optional_memo"
  }
}
```

## Success Responses

### **EVM Chains**
```json
{
  "message": "Cross-chain swap executed successfully for ETH",
  "success": true,
  "fromCoin": "ETH",
  "network": "ethereum",
  "txHash": "0x1234567890abcdef...",
  "blockNumber": 18500000,
  "gasUsed": "21000"
}
```

### **Solana**
```json
{
  "message": "Cross-chain swap executed successfully for SOL",
  "success": true,
  "fromCoin": "SOL",
  "network": "solana",
  "txHash": "5J7XKw8N2G3vQ9H1F4R6Y8Z2M5P3K7L9N4B6X8V2C1A9S7D3F5G8H2J4K6M9P1Q3"
}
```

### **SUI**
```json
{
  "message": "Cross-chain swap executed successfully for SUI",
  "success": true,
  "fromCoin": "SUI",
  "network": "sui",
  "txHash": "9x8Y7w6V5u4T3s2R1q0P9o8N7m6L5k4J3i2H1g0F9e8D7c6B5a4Z3y2X1w0V9u8T"
}
```

### **Bitcoin**
```json
{
  "message": "Cross-chain swap executed successfully for BTC",
  "success": true,
  "fromCoin": "BTC",
  "network": "bitcoin",
  "depositRequired": true,
  "toAddress": "bc1qbridgeDeposit...",
  "amount": 0.3,
  "amountSatoshis": "30000000",
  "memo": "optional_memo",
  "message": "Please send Bitcoin to the provided deposit address to complete the swap"
}
```

## Error Response

```json
{
  "error": "Specific error message",
  "success": false,
  "fromCoin": "ETH"
}
```

## Supported Networks

| Network | Chain ID | Type | Transaction Format |
|---------|----------|------|-------------------|
| Ethereum | 1 | EVM | Full transaction object |
| BNB Smart Chain | 56 | EVM | Full transaction object |
| Avalanche | 43114 | EVM | Full transaction object |
| Optimism | 10 | EVM | Full transaction object |
| Arbitrum | 42161 | EVM | Full transaction object |
| Solana | 1151111081099710 | SOL | Base64 serialized |
| SUI | 9270000000000000 | SUI | Base64 serialized |
| Bitcoin | 20000000000001 | BTC | Deposit address |

## Get Swap Status

**GET** `http://localhost:9876/api/swap/status/:txHash`

```json
{
  "message": "Swap status retrieved successfully",
  "transaction": {
    "_id": "...",
    "txHash": "0x1234...",
    "status": "success",
    "swapDetails": {
      "fromCoin": "ETH",
      "toCoin": "SOL",
      "fromAmount": "1.0",
      "toAmount": "20.5"
    }
  }
}
```

## Integration Flow

1. **Get LiFi Quote**: Call LiFi API to get available routes
2. **Select Route**: Choose the best route for your swap
3. **Get Transaction**: Call LiFi API to get the transaction request
4. **Execute Swap**: Use this controller to execute the transaction
5. **Monitor Status**: Check transaction status and completion

## Important Notes

⚠️ **Private Key Security**: Never log or store private keys
⚠️ **Network Validation**: Controller automatically detects network from transaction
⚠️ **Gas Fees**: Ensure sufficient native tokens for gas fees
⚠️ **Slippage**: LiFi handles slippage protection in the transaction request
