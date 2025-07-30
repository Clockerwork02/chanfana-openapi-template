# DEX Aggregator Frontend

A modern, responsive web application for swapping tokens across multiple DEXs with the best rates.

## Features

- 🔗 **Wallet Connection** - Connect MetaMask and other Web3 wallets
- 💱 **Token Swapping** - Swap tokens with the best rates across multiple DEXs
- 🎨 **Modern UI** - Beautiful, responsive design with dark mode support
- ⚡ **Real-time Quotes** - Get the best quotes from multiple DEX aggregators
- 📱 **Mobile Responsive** - Works perfectly on all devices

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Ethers.js for blockchain interactions
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or other Web3 wallet

### Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
   NEXT_PUBLIC_NETWORK_ID=1
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### Automatic Deployment

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables in Vercel dashboard:**
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`: Your deployed contract address
   - `NEXT_PUBLIC_NETWORK_ID`: Network ID (1 for mainnet, etc.)

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Manual Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel
   ```

## Contract Integration

### Update Contract Address

1. **Deploy your MultiHopAggregator contract** using the Hardhat scripts
2. **Update the contract address** in `src/lib/contracts.ts`:
   ```typescript
   export const CONTRACT_ADDRESSES = {
     aggregator: "YOUR_DEPLOYED_CONTRACT_ADDRESS",
   }
   ```

### Token Configuration

Update token addresses in `src/lib/contracts.ts` for your network:
```typescript
export const TOKEN_ADDRESSES = {
  ETH: "0x0000000000000000000000000000000000000000",
  USDC: "YOUR_USDC_ADDRESS",
  // ... other tokens
}
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── Header.tsx       # Navigation header
│   │   ├── WalletConnect.tsx # Wallet connection
│   │   ├── SwapInterface.tsx # Main swap interface
│   │   ├── TokenSelector.tsx # Token selection dropdown
│   │   └── SwapButton.tsx   # Swap execution button
│   └── lib/                 # Utilities and contracts
│       └── contracts.ts     # Contract ABI and functions
├── public/                  # Static assets
└── package.json            # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue in the repository or contact the development team.