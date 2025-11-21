// Test script to validate swap controller functionality
const axios = require('axios');

// Test data with a simple ETH transfer (this would work on testnet)
const testSwapRequest = {
    fromCoin: "ETH",
    privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", // Replace with valid test key
    user_id: "test_user_123",
    transactionRequest: {
        to: "0x742d35Cc6634C0532925a3b8D4b88d39CfbC5532",
        data: "0x", // Simple ETH transfer (no contract call)
        value: "0x16345785D8A0000", // 0.1 ETH in wei
        chainId: 1,
        gasLimit: "0x5208", // 21000 gas for simple transfer
        gasPrice: "0x4A817C800" // 20 gwei
    }
};

async function testSwapController() {
    try {
        console.log('🧪 Testing Swap Controller...');
        console.log('📋 Request:', JSON.stringify(testSwapRequest, null, 2));

        const response = await axios.post('http://localhost:3000/api/swap/execute', testSwapRequest, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        console.log('✅ Success Response:', response.data);
        return response.data;

    } catch (error) {
        if (error.response) {
            console.log('❌ Server Error Response:', error.response.data);
        } else if (error.request) {
            console.log('❌ Network Error:', error.message);
        } else {
            console.log('❌ Error:', error.message);
        }
        return null;
    }
}

// Test the status endpoint
async function testStatusEndpoint(txHash) {
    try {
        console.log(`🔍 Testing status endpoint for: ${txHash}`);
        
        const response = await axios.get(`http://localhost:3000/api/swap/status/${txHash}`);
        console.log('✅ Status Response:', response.data);
        
    } catch (error) {
        if (error.response) {
            console.log('❌ Status Error:', error.response.data);
        } else {
            console.log('❌ Status Network Error:', error.message);
        }
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting Swap Controller Tests...\n');
    
    // Test 1: Execute swap
    const result = await testSwapController();
    
    if (result && result.txHash) {
        console.log('\n⏳ Waiting 2 seconds before status check...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test 2: Check status
        await testStatusEndpoint(result.txHash);
    }
    
    console.log('\n🏁 Tests completed!');
}

runTests();
