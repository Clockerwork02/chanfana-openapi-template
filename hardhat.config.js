require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");

// You need to add your private key here (use environment variable for security)
const PRIVATE_KEY = process.env.PRIVATE_KEY || "your-private-key-here";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hyperevm: {
      url: "https://rpc.hyperliquid.xyz/evm",
      chainId: 999,
      accounts: PRIVATE_KEY !== "your-private-key-here" ? [PRIVATE_KEY] : [],
      gas: 3000000,
      gasPrice: 1000000000, // 1 gwei
    },
    hyperevmTestnet: {
      url: "https://rpc.hyperliquid-testnet.xyz/evm",
      chainId: 998,
      accounts: PRIVATE_KEY !== "your-private-key-here" ? [PRIVATE_KEY] : [],
      gas: 3000000,
      gasPrice: 1000000000, // 1 gwei
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
    tests: "./test",
  },
};