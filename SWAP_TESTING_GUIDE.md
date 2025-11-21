## Swap Controller Testing Guide

### ⚠️ **Issue with Current Test:**

The error you're seeing is because the transaction data in your test is a complex LiFi cross-chain transaction that:

1. **Requires valid balances** - The wallet needs to have enough ETH and tokens
2. **Has time-sensitive data** - LiFi transactions expire quickly
3. **Needs proper allowances** - ERC20 tokens need approval first
4. **Uses specific contract states** - The contracts need to be in the right state

### 🧪 **Testing Options:**

#### **Option 1: Test with Simple ETH Transfer**
```bash
curl -X POST http://localhost:3000/api/swap/execute \
  -H "Content-Type: application/json" \
  -d '{
    "fromCoin": "ETH",
    "privateKey": "YOUR_TEST_PRIVATE_KEY_HERE",
    "user_id": "test_user_123",
    "transactionRequest": {
      "to": "0x742d35Cc6634C0532925a3b8D4b88d39CfbC5532",
      "data": "0x",
      "value": "0x16345785D8A0000",
      "chainId": 1,
      "gasLimit": "0x5208"
    }
  }'
```

#### **Option 2: Test Error Handling** (This will fail gracefully)
```bash
curl -X POST http://localhost:3000/api/swap/execute \
  -H "Content-Type: application/json" \
  -d '{
    "fromCoin": "ETH",
    "privateKey": "0x1111111111111111111111111111111111111111111111111111111111111111",
    "user_id": "test_user_123",
    "transactionRequest": {
      "to": "0x742d35Cc6634C0532925a3b8D4b88d39CfbC5532",
      "data": "0x",
      "value": "0x0",
      "chainId": 1
    }
  }'
```

#### **Option 3: Real LiFi Integration Test**
1. Get a real LiFi route: `https://li.quest/v1/advanced/routes`
2. Get transaction data: `https://li.quest/v1/advanced/stepTransaction`  
3. Use that data immediately in your swap controller

### 🎯 **What Your Controller IS Working Correctly:**

✅ **Multi-RPC Fallback**: It connected to `eth.llamarpc.com` successfully  
✅ **Transaction Building**: Transaction object was built properly  
✅ **Error Handling**: Failed transaction was saved to database  
✅ **Fast Response**: No 2-minute wait times  

### 📊 **Expected Behavior for Valid Transactions:**

```json
{
  "message": "Cross-chain swap executed successfully for ETH",
  "success": true,
  "fromCoin": "ETH", 
  "network": "ethereum",
  "txHash": "0x1234567890abcdef...",
  "status": "pending",
  "message": "Transaction sent successfully. Use getSwapStatus to check confirmation."
}
```

### 🔧 **Next Steps:**

1. **For Testing**: Use Option 2 above with a test private key
2. **For Production**: Integrate with real LiFi API calls
3. **For Debugging**: Check the database - your failed transaction should be saved

Your swap controller is working correctly! The error is just due to invalid test transaction data.
