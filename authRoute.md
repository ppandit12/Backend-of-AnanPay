# Anan Pay Authentication API Documentation

A comprehensive guide for the authentication system in the Anan Pay crypto wallet backend.

---

## 📋 Overview

The authentication system handles user registration, login, email verification, and PIN management while automatically creating secure crypto wallets for 25+ different cryptocurrencies.

**Base URL:** `/auth`

---

## 🔐 Authentication Flow

### Step 1: User Registration → Step 2: Email Verification → Step 3: Login

---

## 📁 API Endpoints

### 1️⃣ **User Registration**

**Endpoint:** `POST /auth/register`

**Purpose:** Create a new user account with crypto wallets

**Step-by-step Process:**
1. Validate user input (name, email, phone, PIN)
2. Check for existing users with same email/phone
3. Hash the user's PIN using bcrypt
4. Generate crypto wallets for 25+ cryptocurrencies
5. Encrypt all private keys with AES-256-GCM
6. Create 24-word BIP-39 recovery mnemonic
7. Generate 4-digit OTP with 10-minute expiration
8. Send verification email to user
9. Save user data to database

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "pin": "1234",
  "role": "user"
}
```

**Success Response (201):**
```json
{
  "msg": "OTP sent to email for verification",
  "mnemonic": "abandon able about above absent absorb abstract absurd abuse access accident account accurate achieve acid acoustic acquire across act action actor actual adapt add"
}
```

**What Happens Behind the Scenes:**
- ✅ Creates wallets for: ETH, BTC, LTC, SOL, XRP, TRX, ADA, SUI
- ✅ Creates EVM wallets for: BNB, AVAX, Optimism, Arbitrum
- ✅ Creates DeFi token wallets: LINK, AAVE, UNI
- ✅ Creates stablecoin wallets: USDT/USDC on 7 networks
- ✅ All private keys encrypted and secure

---

### 2️⃣ **Email Verification**

**Endpoint:** `POST /auth/verify-otp`

**Purpose:** Verify the OTP sent to user's email

**Step-by-step Process:**
1. Validate email and OTP from request
2. Find user with matching email and OTP
3. Check if OTP hasn't expired (10 minutes)
4. Mark email as verified
5. Clear OTP fields from database
6. User can now login

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "1234"
}
```

**Success Response (200):**
```json
{
  "msg": "Email verified. You can now login."
}
```

---

### 3️⃣ **User Login**

**Endpoint:** `POST /auth/login`

**Purpose:** Authenticate user and return JWT token

**Step-by-step Process:**
1. Find user by email
2. Check if email is verified
3. Compare provided PIN with hashed PIN in database
4. Generate JWT token with user data and wallet info
5. Return token (valid for 30 days)

**Request Body:**
```json
{
  "email": "john@example.com",
  "pin": "1234"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**JWT Token Contains:**
```json
{
  "id": "user_id",
  "email": "john@example.com",
  "role": "user",
  "isKycApproved": false,
  "isEmailVerified": true,
  "wallets": { /* all wallet data */ },
  "exp": 1660000000
}
```

---

### 4️⃣ **Resend OTP**

**Endpoint:** `POST /auth/resend-otp`

**Purpose:** Send a new OTP to user's email

**Step-by-step Process:**
1. Find user by email
2. Generate new 4-digit OTP
3. Set 10-minute expiration
4. Update user record in database
5. Send email with new OTP

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "msg": "New OTP sent to email for PIN reset"
}
```

---

### 5️⃣ **Reset PIN**

**Endpoint:** `POST /auth/reset-pin`

**Purpose:** Reset user's PIN using OTP verification

**Step-by-step Process:**
1. Find user with matching email and OTP
2. Verify OTP hasn't expired
3. Hash the new PIN with bcrypt
4. Update user's PIN in database
5. Clear OTP fields
6. Keep email verification status

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "1234",
  "newPin": "5678"
}
```

**Success Response (200):**
```json
{
  "msg": "PIN reset successfully. You can now login with the new PIN."
}
```

---

### 6️⃣ **Decrypt Keys** ⚠️ (Testing Only)

**Endpoint:** `POST /auth/decrypt`

**Purpose:** Decrypt private keys for testing (REMOVE IN PRODUCTION)

**Request Body:**
```json
{
  "email": "john@example.com",
  "pin": "1234"
}
```

**Success Response (200):**
```json
{
  "decryptedKeys": {
    "ethereum": "0x1234567890abcdef...",
    "bitcoin": "L1234567890abcdef...",
    "solana": "5a1b2c3d4e5f6a7b..."
  },
  "decryptedMnemonic": "abandon able about..."
}
```

---

## ⚠️ Error Handling

### Common Error Responses:

**400 - Bad Request:**
```json
{
  "msg": "Email or phone already exists"
}
```

**401 - Unauthorized:**
```json
{
  "msg": "Invalid pin"
}
```

**404 - Not Found:**
```json
{
  "msg": "User not found"
}
```

**500 - Server Error:**
```json
{
  "msg": "Server error",
  "error": "detailed error message"
}
```

---

## 🔒 Security Features

### 1. **Encryption (AES-256-GCM)**
- All private keys encrypted before storage
- Each key has unique IV, auth tag, and salt
- Encryption key derived from user's PIN

### 2. **PIN Security**
- PINs hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Required for key decryption

### 3. **OTP System**
- 4-digit random codes
- 10-minute expiration
- Cleared after successful verification

### 4. **Email Verification**
- Must verify email before login
- Prevents unauthorized account creation
- OTP sent via Gmail SMTP

### 5. **JWT Tokens**
- 30-day expiration
- Contains user permissions
- Includes wallet information

---

## 🌐 Supported Cryptocurrencies

### **Native Coins (8)**
- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- Solana (SOL)
- XRP
- TRON (TRX)
- Cardano (ADA)
- SUI

### **EVM Networks (4)**
- Binance Smart Chain (BNB)
- Avalanche (AVAX)
- Optimism (ETH)
- Arbitrum (ETH)

### **DeFi Tokens (3)**
- Chainlink (LINK)
- AAVE
- Uniswap (UNI)

### **Stablecoins on 7 Networks (14)**
- USDT: Ethereum, Avalanche, BSC, Solana, TRON, Optimism, Arbitrum
- USDC: Ethereum, Avalanche, BSC, Solana, TRON, Optimism, Arbitrum

**Total: 29 different wallet addresses per user**

---

## ⚙️ Environment Setup

### Required Environment Variables:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
JWT_SECRET=your-secret-key
```

### Dependencies:
- `bcrypt` - PIN hashing
- `jsonwebtoken` - JWT tokens
- `nodemailer` - Email sending
- `ethers` - Ethereum wallets
- `bitcoinjs-lib` - Bitcoin wallets
- `@solana/web3.js` - Solana wallets
- `xrpl` - XRP wallets
- `tronweb` - TRON wallets
- And more...

---

## 🚀 Quick Start Example

```javascript
// 1. Register a new user
POST /auth/register
{
  "name": "Alice Smith",
  "email": "alice@example.com", 
  "phone": "+1234567890",
  "pin": "1234"
}

// 2. Verify email with OTP
POST /auth/verify-otp
{
  "email": "alice@example.com",
  "otp": "5678"
}

// 3. Login and get token
POST /auth/login
{
  "email": "alice@example.com",
  "pin": "1234"
}

// 4. Use token for authenticated requests
Authorization: Bearer <jwt-token>
```

---

**🔐 Security Note:** All private keys are encrypted and never stored in plain text. The 24-word mnemonic can recover all wallets across different blockchain networks.
