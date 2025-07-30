// MultiHopAggregator ABI (simplified for frontend use)
export const AGGREGATOR_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_feeCollector",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_v2",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_v3",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_kitten",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_liquid",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_gluex",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_pxv1",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_pxv2",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenIn",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenOut",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      }
    ],
    "name": "getBestQuote",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "bestAmountOut",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "bestRouter",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenIn",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenOut",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "swap",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amountOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// Contract addresses (replace with actual deployed addresses)
export const CONTRACT_ADDRESSES = {
  // Replace with your deployed contract address
  aggregator: "0x0000000000000000000000000000000000000000", // TODO: Add deployed address
}

// Token addresses (example - replace with actual addresses)
export const TOKEN_ADDRESSES = {
  ETH: "0x0000000000000000000000000000000000000000",
  USDC: "0xA0b86a33E6441b8C4C8C0C8C0C8C0C8C0C8C0C8C",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
}

// Contract interaction functions
export async function getBestQuote(
  contract: any,
  tokenIn: string,
  tokenOut: string,
  amountIn: string
) {
  try {
    const result = await contract.getBestQuote(tokenIn, tokenOut, amountIn)
    return {
      bestAmountOut: result.bestAmountOut.toString(),
      bestRouter: result.bestRouter
    }
  } catch (error) {
    console.error('Error getting best quote:', error)
    throw error
  }
}

export async function executeSwap(
  contract: any,
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  amountOutMin: string,
  to: string
) {
  try {
    const tx = await contract.swap(tokenIn, tokenOut, amountIn, amountOutMin, to)
    return await tx.wait()
  } catch (error) {
    console.error('Error executing swap:', error)
    throw error
  }
}