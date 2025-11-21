

 "ETH": {   
                "address": "0x0000000000000000000000000000000000000000",  
                "chainId": 1,  
                "symbol": "ETH",  
                "decimals": 18,  
                "name": "ETH",  
                "coinKey": "ETH",  
                "wei": "1,000,000,000,000,000,000"
   },   

   "UNI": {
       "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        "chainId": 1,
        "symbol": "UNI",
        "decimals": 18,
        "name": "Uniswap",
   },

   "AAVE": {  
        "address": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
        "chainId": 1,
        "symbol": "AAVE",
        "decimals": 18,
        "name": "Aave",
   },
   "ARBITRUM": {
      "address": "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
        "chainId": 1,
        "symbol": "ARB",
        "decimals": 18,
        "name": "Arbitrum",
   },
   "LINK": {
        "address": "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        "chainId": 1,
        "symbol": "LINK",
        "decimals": 18,
        "name": "Chainlink",
   },

"SOL": {    
  "address": "11111111111111111111111111111111",   
              "chainId": 1151111081099710,   
              "symbol": "SOL",  
              "decimals": 9,  
              "name": "SOL",  
              "coinKey": "SOL",  
              "lamports": "1,000,000,000"
}     
"BNB":{   
    "address": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        "chainId": 1,
        "symbol": "BNB",
        "decimals": 18,
        "name": "BNB",
        "coinKey": "BNB",
}  
"BTC":{   
  "address": "bitcoin",
      "chainId": 20000000000001,
      "symbol": "BTC",
      "decimals": 8,
      "name": "Bitcoin",
      "coinKey": "BTC",
      satoshis: "100,000,000"
}
  
 "SUI": {
                "address": "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
                "chainId": 9270000000000000,
                "symbol": "SUI",
                "decimals": 9,
                "name": "SUI",
                "coinKey": "SUI",
                "mist": "1,000,000,000"
}

"AVAX": {
   "address": "0x0000000000000000000000000000000000000000",
    "chainId": 43114,
    "symbol": "AVAX",
    "decimals": 18,
    "name": "AVAX",
    "coinKey": "AVAX",

}

"USDT-ETH": {
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "chainId": 1,
        "symbol": "USDT",
        "decimals": 6,
        "name": "USDT",
        "coinKey": "USDT",
}
"USDC-ETH":{
        "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "chainId": 1,
        "symbol": "USDC",
        "decimals": 6,
        "name": "USD Coin",
        "coinKey": "USDC",
}
"USDT-AVAX":{

        "address": "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
        "chainId": 43114,
        "symbol": "USDt",
        "decimals": 6,
        "name": "TetherToken",
        "coinKey": "USDt",
}
"USDC-AVAX": {
        "address": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        "chainId": 43114,
        "symbol": "USDC",
        "decimals": 6,
        "name": "USD Coin",
        "coinKey": "USDC",
}

"USDT-SOL" :{
        "address": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        "chainId": 1151111081099710,
        "symbol": "USDT",
        "decimals": 6,
        "name": "USDT",
        "coinKey": "USDT",
        
}
"USDC-SOL" :{
        "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "chainId": 1151111081099710,
        "symbol": "USDC",
        "decimals": 6,
        "name": "USD Coin",
}



https://li.quest/v1/advanced/routes
{
  "fromChainId": 1,
  "toChainId": 10,
  "fromTokenAddress": "0x0000000000000000000000000000000000000000",
  "toTokenAddress": "0x4200000000000000000000000000000000000042",
  "fromAddress": "0xd5dc0a2151ae1242E138EBEE27C1DdaA4A81E9dB",
  "toAddress": "0xd5dc0a2151ae1242E138EBEE27C1DdaA4A81E9dB",
  "fromAmount": "1000000000000000000",
  "options": {
    "order": "CHEAPEST",
  }
}



https://li.quest/v1/advanced/stepTransaction

{
  "type": "lifi",
  "id": "3efb8717-400a-4026-9dc5-92e998a51f55:0",
  "tool": "gasZipBridge",
  "toolDetails": {
    "key": "gasZipBridge",
    "name": "GasZip",
    "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/gaszip.svg"
  },
  "action": {
    "fromToken": {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 1,
      "symbol": "ETH",
      "decimals": 18,
      "name": "ETH",
      "coinKey": "ETH",
      "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
      "priceUSD": "3891.860724180653"
    },
    "fromAmount": "1000000000000000000",
    "toToken": {
      "address": "11111111111111111111111111111111",
      "chainId": 1151111081099710,
      "symbol": "SOL",
      "decimals": 9,
      "name": "SOL",
      "coinKey": "SOL",
      "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
      "priceUSD": "193.182481232874"
    },
    "fromChainId": 1,
    "toChainId": 1151111081099710,
    "slippage": 0.005,
    "fromAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
    "toAddress": "ML4Lst6C6bHkK9y98moWN9jpdfSae4cDiBPXuRPuFDe"
  },
  "estimate": {
    "tool": "gasZipBridge",
    "approvalAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
    "toAmountMin": "20254239819",
    "toAmount": "20254239819",
    "fromAmount": "1000000000000000000",
    "feeCosts": [],
    "gasCosts": [
      {
        "type": "SEND",
        "price": "398186224",
        "estimate": "105806",
        "limit": "137548",
        "amount": "42130491616544",
        "amountUSD": "0.1639",
        "token": {
          "address": "0x0000000000000000000000000000000000000000",
          "chainId": 1,
          "symbol": "ETH",
          "decimals": 18,
          "name": "ETH",
          "coinKey": "ETH",
          "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
          "priceUSD": "3890.0919700776844"
        }
      }
    ],
    "executionDuration": 4,
    "fromAmountUSD": "3891.8607",
    "toAmountUSD": "3912.7643"
  },
  "includedSteps": [
    {
      "id": "f81ea5e1-2e93-49c5-924e-ba6314734abf",
      "type": "cross",
      "action": {
        "fromChainId": 1,
        "fromAmount": "1000000000000000000",
        "fromToken": {
          "address": "0x0000000000000000000000000000000000000000",
          "chainId": 1,
          "symbol": "ETH",
          "decimals": 18,
          "name": "ETH",
          "coinKey": "ETH",
          "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
          "priceUSD": "3891.860724180653"
        },
        "toChainId": 1151111081099710,
        "toToken": {
          "address": "11111111111111111111111111111111",
          "chainId": 1151111081099710,
          "symbol": "SOL",
          "decimals": 9,
          "name": "SOL",
          "coinKey": "SOL",
          "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
          "priceUSD": "193.182481232874"
        },
        "fromAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        "toAddress": "ML4Lst6C6bHkK9y98moWN9jpdfSae4cDiBPXuRPuFDe",
        "destinationGasConsumption": "0"
      },
      "estimate": {
        "tool": "gasZipBridge",
        "fromAmount": "1000000000000000000",
        "toAmount": "20254239819",
        "toAmountMin": "20254239819",
        "gasCosts": [
          {
            "type": "SEND",
            "price": "395812657",
            "estimate": "70000",
            "limit": "91000",
            "amount": "27706885990000",
            "amountUSD": "0.1078",
            "token": {
              "address": "0x0000000000000000000000000000000000000000",
              "chainId": 1,
              "symbol": "ETH",
              "decimals": 18,
              "name": "ETH",
              "coinKey": "ETH",
              "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
              "priceUSD": "3890.141015547247"
            }
          }
        ],
        "executionDuration": 4,
        "approvalAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        "feeCosts": []
      },
      "tool": "gasZipBridge",
      "toolDetails": {
        "key": "gasZipBridge",
        "name": "GasZip",
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/gaszip.svg"
      }
    }
  ]
}



response => 

"transactionRequest": {
    "data": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAGCcYMUJHytZHLILOVHvF+B8YA9qGTWSFFEqzrM+VvVjSbHoxPq4mUSUyPHlwSh0RbKRfWDEPHmqlZFi9dYABZjTIKI/NO/NLZ8aID4MZaKz1jVwknx2G8Vej5f1EA4avlaAMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAKD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FUGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAI4pzeE14U/L4hY61x9yIQJ9d1+DAenSl4zEWd+wsnQrAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADe2RMxGvk9Wc9c3vEcJtQnIrM8lUORnUnwyPYhg6ITdOVXu79hjTCp68tryQTSyMpw3aem2fWVgZj+Tkprd5CkBQMABQLAJwkAAwAJA/9DDwAAAAAABAIFBgkA5ydNdw+LXQAHAgABDAIAAACgJSYAAAAAAAgDAAcCNvIjxolS4fK2YKR0OwAAAAABAAAA/wAAAAAAAAAAAAAAAAAgX9F4fv/HQdf3vXqI9ZDL0LySpQA="
  }