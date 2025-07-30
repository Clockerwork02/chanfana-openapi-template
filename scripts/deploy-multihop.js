const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MultiHopAggregator to HyperEVM (Chain ID: 999)...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "HYPE");
  
  // Real HyperEVM DEX Router Addresses (Verified on purrsec.com)
  const DEX_ADDRESSES = {
    feeCollector: "0xad63f721996c19204c24cffa2416f1d7618df828", // Your fee collector wallet
    hyperSwapV2: "0xb4a9C4e6Ea8E2191d2FA5B380452a634Fb21240A",
    hyperSwapV3: "0x4e2960a8cd19b467b82d26d83facb0fae26b094d", 
    kittenSwap: "0x8ffdb06039b1b8188c2c721dc3c435b5773d7346",
    liquidSwap: "0x744489ee3d540777a66f2cf297479745e0852f7a",
    glueX: "0xe95f6eaeae1e4d650576af600b33d9f7e5f9f7fd",
    projectXV1: "0x1EbDFC75FfE3ba3de61E7138a3E8706aC841Af9B",
    projectXV2: "0x9EE0D03BB45268860dd9A72Ab681d36C80ea7974"
  };
  
  console.log("\n📋 DEX Router Configuration:");
  console.log("════════════════════════════════════════");
  console.log("Fee Collector:", DEX_ADDRESSES.feeCollector);
  console.log("HyperSwap V2:", DEX_ADDRESSES.hyperSwapV2);
  console.log("HyperSwap V3:", DEX_ADDRESSES.hyperSwapV3);
  console.log("KittenSwap:", DEX_ADDRESSES.kittenSwap);
  console.log("LiquidSwap:", DEX_ADDRESSES.liquidSwap);
  console.log("GlueX:", DEX_ADDRESSES.glueX);
  console.log("Project X V1:", DEX_ADDRESSES.projectXV1);
  console.log("Project X V2:", DEX_ADDRESSES.projectXV2);
  
  // Deploy MultiHopAggregator
  console.log("\n📦 Deploying MultiHopAggregator contract...");
  const MultiHopAggregator = await ethers.getContractFactory("MultiHopAggregator");
  
  const aggregator = await MultiHopAggregator.deploy(
    DEX_ADDRESSES.feeCollector,
    DEX_ADDRESSES.hyperSwapV2,
    DEX_ADDRESSES.hyperSwapV3,
    DEX_ADDRESSES.kittenSwap,
    DEX_ADDRESSES.liquidSwap,
    DEX_ADDRESSES.glueX,
    DEX_ADDRESSES.projectXV1,
    DEX_ADDRESSES.projectXV2,
    {
      gasLimit: 2000000, // Sufficient gas for deployment
      gasPrice: ethers.utils.parseUnits("1", "gwei"),
    }
  );
  
  await aggregator.deployed();
  
  console.log("✅ MultiHopAggregator deployed successfully!");
  console.log("📍 Contract address:", aggregator.address);
  console.log("💰 Fee collector:", DEX_ADDRESSES.feeCollector);
  console.log("🔗 Transaction hash:", aggregator.deployTransaction.hash);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  
  const owner = await aggregator.owner();
  const feeCollector = await aggregator.feeCollector();
  const hyperSwapV2 = await aggregator.hyperSwapV2();
  const hyperSwapV3 = await aggregator.hyperSwapV3();
  
  console.log("Owner:", owner);
  console.log("Fee Collector:", feeCollector);
  console.log("HyperSwap V2 Router:", hyperSwapV2);
  console.log("HyperSwap V3 Router:", hyperSwapV3);
  
  // Test getBestQuote functionality (with example tokens)
  console.log("\n🧪 Testing Quote Functionality...");
  
  // Example: HYPE to PURR quote (if pools exist)
  const HYPE_TOKEN = "0x5555555555555555555555555555555555555555";
  const PURR_TOKEN = "0x9b498c8C395F2df3C4cFAB75672B72c52DD17E2B";
  const TEST_AMOUNT = ethers.utils.parseEther("1"); // 1 HYPE
  
  try {
    const quote = await aggregator.getBestQuote(HYPE_TOKEN, PURR_TOKEN, TEST_AMOUNT);
    console.log("✅ Quote test successful!");
    console.log("Best amount out:", ethers.utils.formatEther(quote.bestAmountOut));
    console.log("Best router:", quote.bestRouter);
  } catch (error) {
    console.log("⚠️  Quote test failed (normal if no liquidity):", error.message);
  }
  
  console.log("\n🎯 Integration Complete!");
  console.log("════════════════════════════════════════");
  console.log("Your MultiHopAggregator is ready with:");
  console.log("• 7 integrated HyperEVM DEX routers");
  console.log("• Automatic best price discovery");
  console.log("• 10% fee collection (adjustable)");
  console.log("• Emergency withdrawal protection");
  console.log("• Owner access controls");
  
  console.log("\n📖 Available Functions:");
  console.log("• getBestQuote(tokenIn, tokenOut, amountIn)");
  console.log("• swap(tokenIn, tokenOut, amountIn, amountOutMin, to)");
  console.log("• setFeeCollector(address) [Owner only]");
  
  console.log("\n🌐 Explorer Links:");
  console.log("purrsec.com:", `https://purrsec.com/address/${aggregator.address}`);
  console.log("hyperscan.com:", `https://hyperscan.com/address/${aggregator.address}`);
  
  // Generate ABI for frontend integration
  const abi = [
    "function getBestQuote(address tokenIn, address tokenOut, uint amountIn) external view returns (uint bestAmountOut, address bestRouter)",
    "function swap(address tokenIn, address tokenOut, uint amountIn, uint amountOutMin, address to) external returns (uint amountOut)",
    "function setFeeCollector(address _collector) external",
    "function owner() external view returns (address)",
    "function feeCollector() external view returns (address)"
  ];
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: aggregator.address,
    abi: abi,
    owner: owner,
    feeCollector: feeCollector,
    dexRouters: DEX_ADDRESSES,
    chainId: 999,
    deployedAt: new Date().toISOString(),
    txHash: aggregator.deployTransaction.hash,
    supportedFeatures: [
      "Multi-DEX aggregation across 7 routers",
      "Best price discovery",
      "Configurable fee collection", 
      "Owner access controls",
      "Emergency functions"
    ]
  };
  
  require('fs').writeFileSync(
    'multihop-deployment.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n💾 Deployment info saved to multihop-deployment.json");
  console.log("💡 Use this file for frontend integration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });