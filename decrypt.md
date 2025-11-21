# Decrypt API Documentation

This document contains the decrypt endpoint and payload information for the Crypto Wallet Backend API.

## Base URL
```
http://localhost:3000/api/auth
```

---

## Decrypt Private Keys and Mnemonic

**Endpoint:** `POST /decrypt`

**Description:** Decrypts all stored private keys and mnemonic phrase for a registered user using their PIN.

**Payload:**
```json
{
  "email": "user@example.com",
  "pin": "1234"
}
```

**Success Response:**
```json
{
  "decryptedKeys": {
    "ethereum": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "bnb": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "avax": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "optimism": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "arbitrum": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "chainlink": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "aave": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "uni": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "bitcoin": "L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ",
    "litecoin": "T7qQf4Z2q4qJp3q7q4qJp3q7q4qJp3q7q4qJp3q7q4qJp3q7",
    "solana": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "xrp": "sEdTM1uX8pu2do5XvTnutH6HsouMaM2",
    "tron": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdt_ethereum": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdc_ethereum": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdt_avalanche": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdc_avalanche": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdt_bnb": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdc_bnb": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdt_solana": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdc_solana": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdt_tron": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdc_tron": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdt_optimism": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdc_optimism": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdt_arbitrum": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "usdc_arbitrum": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "cardano": "ed25519_sk1xy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfx01ahx6kmw3y8d",
    "sui": "suiprivkey1qyx2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfx01ahx6kmw3y8d"
  },
  "decryptedMnemonic": "abandon ability able about above absent absorb abstract absurd abuse access accident"
}
```

---

## Supported Wallet Types

The decrypt endpoint can decrypt private keys for the following wallet types:

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
- **cardano**: Cardano (ADA)
- **sui**: SUI (SUI)

### ERC-20 Tokens
- **chainlink**: Chainlink (LINK) on Ethereum
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

## Error Responses

### User Not Found
```json
{
  "msg": "User not found"
}
```

### Missing Wallet Data
```json
{
  "msg": "Wallet or mnemonic data missing"
}
```

### Decryption Error
```json
{
  "msg": "Decryption error",
  "error": "Error message describing what went wrong"
}
```

### Individual Wallet Decryption Failures
If specific wallets fail to decrypt, they will show in the response as:
```json
{
  "decryptedKeys": {
    "ethereum": "0xabcdef...",
    "bitcoin": "Decryption failed",
    "solana": "Wallet not found"
  }
}
```

---

## Private Key Formats

Different cryptocurrencies use different private key formats:

### EVM-Compatible Chains (Ethereum, BNB, Avalanche, Optimism, Arbitrum)
- **Format**: Hexadecimal string starting with `0x`
- **Length**: 66 characters (including `0x` prefix)
- **Example**: `0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`

### Bitcoin
- **Format**: Wallet Import Format (WIF)
- **Example**: `L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ`

### Litecoin
- **Format**: Wallet Import Format (WIF) for Litecoin network
- **Example**: `T7qQf4Z2q4qJp3q7q4qJp3q7q4qJp3q7q4qJp3q7q4qJp3q7`

### Solana
- **Format**: Base58 encoded private key
- **Length**: 128 characters
- **Example**: `abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`

### XRP
- **Format**: Base58 encoded seed
- **Example**: `sEdTM1uX8pu2do5XvTnutH6HsouMaM2`

### TRON
- **Format**: Hexadecimal string (64 characters)
- **Example**: `abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`

### Cardano
- **Format**: Extended private key in hexadecimal format
- **Example**: `ed25519_sk1xy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfx01ahx6kmw3y8d`

### SUI
- **Format**: Bech32 encoded private key
- **Example**: `suiprivkey1qyx2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfx01ahx6kmw3y8d`

---

## Security Notes

⚠️ **CRITICAL SECURITY WARNING**: This endpoint returns sensitive private key information in plain text.

1. **PIN Protection**: Private keys are encrypted using AES-256-GCM with the user's PIN as the decryption key.

2. **Transport Security**: Always use HTTPS in production to protect data in transit.

3. **Temporary Use**: This endpoint is primarily for testing and development. In production, consider:
   - Implementing additional authentication layers
   - Rate limiting to prevent brute force attacks
   - Audit logging for all decrypt requests
   - Time-limited access tokens

4. **Private Key Handling**: 
   - Never log or store decrypted private keys
   - Clear sensitive data from memory immediately after use
   - Consider using secure enclaves or HSMs for production environments

5. **Mnemonic Phrase**: The mnemonic phrase can be used to regenerate all wallet private keys and should be treated with extreme care.

---

## Encryption Details

The system uses the following encryption parameters:

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 100,000
- **Salt**: 16 random bytes (unique per encryption)
- **IV**: 16 random bytes (unique per encryption)
- **Auth Tag**: 16 bytes for authentication

This provides strong protection against various attack vectors including dictionary attacks and ensures data integrity.
