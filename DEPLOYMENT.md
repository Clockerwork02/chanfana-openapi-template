# HyperEVM DEX Aggregator Deployment Guide

## 🎯 Complete DEX Aggregator Solution

This project provides both **immediate integration** and **custom deployment** options for the HyperEVM DEX Aggregator.

### Current DEX Count: **7 Active DEXs**

1. **HyperSwap V2** - `0xb4a9C4e6Ea8E2191d2FA5B380452a634Fb21240A`
2. **HyperSwap V3** - `0x4e2960a8cd19b467b82d26d83facb0fae26b094d`
3. **KittenSwap** - `0x8ffdb06039b1b8188c2c721dc3c435b5773d7346`
4. **LiquidSwap** - `0x744489ee3d540777a66f2cf297479745e0852f7a`
5. **GlueX** - `0xe95f6eaeae1e4d650576af600b33d9f7e5f9f7fd`
6. **Project X V1** - `0x1EbDFC75FfE3ba3de61E7138a3E8706aC841Af9B`
7. **Project X V2** - `0x9EE0D03BB45268860dd9A72Ab681d36C80ea7974`

---

## 🚀 Option 1: Immediate Integration (Use Existing Contract)

### Pre-deployed Contract
- **Address**: `0xcBEEA2f172F517729d70adE85d313411572Dab32`
- **Chain**: HyperEVM Mainnet (999)
- **Fee Collector**: `0xad63f721996c19204c24cffa2416f1d7618df828`

### Frontend Integration

```javascript
import MultiHopAggregatorABI from './src/abi/MultiHopAggregator.json';

const aggregatorContract = new ethers.Contract(
  "0xcBEEA2f172F517729d70adE85d313411572Dab32",
  MultiHopAggregatorABI.abi,
  signer
);

// Get best quote across all 7 DEXs
const quote = await aggregatorContract.getBestQuote(
  tokenInAddress,
  tokenOutAddress,
  ethers.utils.parseEther("1") // 1 token
);

console.log("Best price:", ethers.utils.formatEther(quote.bestAmountOut));
console.log("Best router:", quote.bestRouter);

// Execute swap
const tx = await aggregatorContract.swap(
  tokenInAddress,
  tokenOutAddress,
  ethers.utils.parseEther("1"), // amount in
  quote.bestAmountOut.mul(95).div(100), // 5% slippage
  recipientAddress
);
```

---

## 🔧 Option 2: Deploy Your Own Contract

### Prerequisites

1. **Install Dependencies**
```bash
npm install
```

2. **Setup Environment**
Create `.env` file:
```bash
PRIVATE_KEY=your-private-key-here
FEE_COLLECTOR=your-fee-collector-address
```

3. **Fund Deployment Wallet**
- Need at least 0.1 HYPE for deployment
- Get HYPE from HyperLiquid exchange

### Deployment Steps

1. **Compile Contracts**
```bash
npm run hardhat:compile
```

2. **Deploy to HyperEVM Mainnet**
```bash
npm run deploy:aggregator
```

3. **Deploy to Testnet (Optional)**
```bash
npm run deploy:aggregator:testnet
```

### Post-Deployment

After deployment, you'll get:
- Contract address
- Transaction hash
- Deployment info saved to `multihop-deployment.json`

---

## 🛡️ Emergency Withdrawal Features

Both options include emergency withdrawal protection:

### Owner Functions (Your Wallet Only)
```javascript
// Change fee collector
await aggregatorContract.setFeeCollector(newAddress);

// Emergency withdrawal (if funds get stuck)
// This requires you to own the contract
```

### Contract Security
- Owner-only access controls
- 10% configurable fee (adjustable by owner)
- All DEX router addresses verified on purrsec.com
- Emergency pause functionality

---

## 🔍 Verification & Testing

### Verify on Block Explorers
- **purrsec.com**: `https://purrsec.com/address/YOUR_CONTRACT_ADDRESS`
- **hyperscan.com**: `https://hyperscan.com/address/YOUR_CONTRACT_ADDRESS`

### Test Quote Function
```bash
# After deployment, test with small amounts
npx hardhat run scripts/test-quote.js --network hyperevm
```

### Available Functions
- `getBestQuote(tokenIn, tokenOut, amountIn)` - Get best price across all DEXs
- `swap(tokenIn, tokenOut, amountIn, amountOutMin, to)` - Execute optimal swap
- `setFeeCollector(address)` - Update fee recipient (owner only)

---

## 📊 API Backend Integration

The project also includes a complete API backend for the DEX aggregator:

### API Endpoints
- `GET /dex-aggregator/quote` - Get best quotes
- `POST /dex-aggregator/swap` - Execute swaps
- `GET /dex-aggregator/health` - System status
- `GET /dex-aggregator/tokens` - Supported tokens

### Deploy API Backend
```bash
npm run deploy  # Deploys to Cloudflare Workers
```

---

## 🎯 Which Option to Choose?

### Use Existing Contract If:
- You want immediate integration
- You're okay with 10% fee going to the existing fee collector
- You need quick deployment for testing/MVP

### Deploy Your Own If:
- You want full control over fees
- You need emergency withdrawal access
- You want to customize the contract
- You're building a production application

---

## 🚨 Important Notes

1. **Fee Collection**: The contract has a 10% fee built-in
2. **Owner Access**: Only the deployer can access emergency functions
3. **Gas Optimization**: Contract is optimized for HyperEVM gas limits
4. **Multi-DEX Support**: Automatically finds best prices across all 7 DEXs
5. **Withdrawal Protection**: Emergency functions prevent stuck funds

---

## 🔗 Useful Links

- **HyperEVM RPC**: `https://rpc.hyperliquid.xyz/evm`
- **Chain ID**: 999 (mainnet), 998 (testnet)
- **Block Explorer**: https://purrsec.com
- **DEX Aggregator Health**: `YOUR_API_URL/dex-aggregator/health`

---

## 📞 Support

For deployment issues or questions:
1. Check contract addresses on purrsec.com
2. Verify all DEX router addresses are correct
3. Ensure sufficient HYPE balance for gas
4. Test on testnet first before mainnet deployment