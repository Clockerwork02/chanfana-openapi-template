# DEX Aggregator - Full Stack Project

A complete DEX aggregator implementation with smart contracts (backend) and a modern web interface (frontend) for swapping tokens across multiple decentralized exchanges.

## 🚀 Features

### Backend (Smart Contracts)
- **MultiHopAggregator**: Core contract that finds the best swap routes across 7 DEX routers
- **Multi-DEX Support**: Integrates with HyperSwap V2/V3, KittenSwap, LiquidSwap, GlueX, Project X V1/V2
- **Fee Collection**: Configurable fee system with collector wallet
- **Slippage Protection**: Built-in slippage controls for safe swaps

### Frontend (Next.js Web App)
- **Modern UI**: Beautiful, responsive design with dark mode
- **Wallet Integration**: MetaMask and Web3 wallet support
- **Real-time Quotes**: Live price feeds from multiple DEXs
- **Token Selection**: Easy token picker with search functionality
- **Vercel Ready**: Deploy directly to Vercel

## 📁 Project Structure

```
├── contracts/                 # Smart Contracts (Backend)
│   ├── MultiHopAggregator.sol # Main aggregator contract
│   └── interfaces/            # Contract interfaces
│       ├── IERC20.sol
│       ├── IUniswapV2Router.sol
│       └── IUniswapV3Router.sol
├── scripts/                   # Deployment scripts
│   └── deploy.js             # Contract deployment
├── frontend/                  # Next.js Web App (Frontend)
│   ├── src/
│   │   ├── app/              # Next.js app directory
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities and contracts
│   ├── package.json          # Frontend dependencies
│   └── README.md             # Frontend setup guide
├── hardhat.config.js         # Hardhat configuration
└── package.json              # Backend dependencies
```

## 🛠️ Quick Start

### Backend Setup (Smart Contracts)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Compile contracts:**
   ```bash
   npx hardhat compile
   ```

3. **Deploy contracts:**
   ```bash
   npx hardhat run scripts/deploy.js --network <your-network>
   ```

### Frontend Setup (Web App)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Smart Contracts
Deploy to your preferred network (Ethereum, HyperEVM, etc.):
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

### Frontend to Vercel
1. **Connect your GitHub repo to Vercel**
2. **Set environment variables:**
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`: Your deployed contract address
3. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

## 🔧 Configuration

### Contract Addresses
Update router addresses in `scripts/deploy.js`:
```javascript
const routers = [
  "0xb4a9C4e6Ea8E2191d2FA5B380452a634Fb21240A", // HyperSwap V2
  "0x4e2960a8cd19b467b82d26d83facb0fae26b094d", // HyperSwap V3
  // ... other routers
];
```

### Frontend Configuration
Update contract address in `frontend/src/lib/contracts.ts`:
```typescript
export const CONTRACT_ADDRESSES = {
  aggregator: "YOUR_DEPLOYED_CONTRACT_ADDRESS",
}
```

## 📚 Documentation

- **Frontend Guide**: See [frontend/README.md](frontend/README.md) for detailed frontend setup
- **Contract Documentation**: See inline comments in Solidity files
- **Deployment Guide**: See `scripts/deploy.js` for deployment instructions

## 🧪 Testing

### Smart Contracts
```bash
npx hardhat test
```

### Frontend
```bash
cd frontend
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support:
- Open an issue in the repository
- Check the documentation in each directory
- Review the inline comments in the code

---

**Built with ❤️ using Hardhat, Next.js, and Tailwind CSS**
