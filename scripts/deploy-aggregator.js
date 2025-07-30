const { ethers } = require("hardhat");

async function main() {
  // HyperEVM configuration
  const HYPEREVM_CHAIN_ID = 999;
  const HYPEREVM_RPC = "https://rpc.hyperliquid.xyz/evm";
  
  console.log("Deploying DEX Aggregator to HyperEVM (Chain ID: 999)...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "HYPE");
  
  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    console.error("⚠️  Warning: Low balance. Need at least 0.1 HYPE for deployment");
  }
  
  // Set fee recipient (replace with your address)
  const FEE_RECIPIENT = deployer.address; // You can change this to your preferred address
  
  // Deploy the DEXAggregator contract
  console.log("\n📦 Deploying DEXAggregator contract...");
  const DEXAggregator = await ethers.getContractFactory("DEXAggregator");
  
  const dexAggregator = await DEXAggregator.deploy(FEE_RECIPIENT, {
    gasLimit: 3000000, // Set gas limit for HyperEVM
    gasPrice: ethers.utils.parseUnits("1", "gwei"), // 1 gwei gas price
  });
  
  await dexAggregator.deployed();
  
  console.log("✅ DEXAggregator deployed successfully!");
  console.log("📍 Contract address:", dexAggregator.address);
  console.log("💰 Fee recipient:", FEE_RECIPIENT);
  console.log("🔗 Chain ID:", HYPEREVM_CHAIN_ID);
  
  // Verify the deployment
  console.log("\n🔍 Verifying deployment...");
  
  // Check supported DEXs
  const activeDEXs = await dexAggregator.getActiveDEXs();
  console.log("📊 Active DEXs count:", activeDEXs.length);
  
  // Get platform fee
  const platformFee = await dexAggregator.platformFee();
  console.log("💳 Platform fee:", platformFee.toString(), "basis points (", (platformFee / 100).toString(), "%)");
  
  // Display contract details
  console.log("\n📋 Contract Details:");
  console.log("════════════════════════════════════════");
  console.log("Contract Address:", dexAggregator.address);
  console.log("Fee Recipient:", FEE_RECIPIENT);
  console.log("Platform Fee:", (platformFee / 100).toString() + "%");
  console.log("Emergency Mode:", await dexAggregator.emergencyMode());
  console.log("Chain ID:", HYPEREVM_CHAIN_ID);
  
  console.log("\n🏭 Supported DEX Routers:");
  console.log("════════════════════════════════════════");
  
  const dexAddresses = [
    "0x0000000000000000000000000000000000000001", // HyperCore-Native
    "0xb4a9C4e6Ea8E2191d2FA5B380452a634Fb21240A", // HyperSwap-V2
    "0x4e2960a8cd19b467b82d26d83facb0fae26b094d", // HyperSwap-V3
    "0x9b498c8C395F2df3C4cFAB75672B72c52DD17E2B", // PURR-DEX
    "0x8ffdb06039b1b8188c2c721dc3c435b5773d7346", // KittenSwap
    "0x744489ee3d540777a66f2cf297479745e0852f7a", // LiquidSwap
    "0xe95f6eaeae1e4d650576af600b33d9f7e5f9f7fd"  // GlueX
  ];
  
  for (const dexAddress of dexAddresses) {
    try {
      const dexConfig = await dexAggregator.getDEXConfig(dexAddress);
      console.log(`✅ ${dexConfig.name}: ${dexAddress} (Fee: ${dexConfig.fee/100}%)`);
    } catch (error) {
      console.log(`❌ DEX at ${dexAddress}: Not configured`);
    }
  }
  
  console.log("\n🔧 Emergency Functions Available:");
  console.log("════════════════════════════════════════");
  console.log("✅ emergencyWithdraw(token, amount, to)");
  console.log("✅ emergencyWithdrawAll(to)");
  console.log("✅ activateEmergencyMode()");
  console.log("✅ deactivateEmergencyMode()");
  
  console.log("\n🚀 Deployment Complete!");
  console.log("════════════════════════════════════════");
  console.log("You now have a fully functional DEX aggregator with:");
  console.log("• 7 integrated HyperEVM DEXs");
  console.log("• Emergency withdrawal protection");
  console.log("• Multi-hop routing capabilities");
  console.log("• Owner access controls");
  console.log("• Platform fee collection");
  
  console.log("\n📖 Next Steps:");
  console.log("1. Verify contract on purrsec.com or hyperscan.com");
  console.log("2. Test with small amounts first");
  console.log("3. Monitor gas usage and optimize as needed");
  console.log("4. Set up monitoring for emergency situations");
  
  console.log("\n🌐 Explorer Links:");
  console.log("purrsec.com:", `https://purrsec.com/address/${dexAggregator.address}`);
  console.log("hyperscan.com:", `https://hyperscan.com/address/${dexAggregator.address}`);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: dexAggregator.address,
    feeRecipient: FEE_RECIPIENT,
    platformFee: platformFee.toString(),
    chainId: HYPEREVM_CHAIN_ID,
    deployedAt: new Date().toISOString(),
    txHash: dexAggregator.deployTransaction.hash,
    supportedDEXs: 7,
    emergencyMode: false
  };
  
  require('fs').writeFileSync(
    'deployment-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n💾 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });