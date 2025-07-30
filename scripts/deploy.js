const hre = require("hardhat");

async function main() {
  const feeCollector = "0xad63f721996c19204c24cffa2416f1d7618df828";
  const routers = [
    "0xb4a9C4e6Ea8E2191d2FA5B380452a634Fb21240A", // HyperSwap V2
    "0x4e2960a8cd19b467b82d26d83facb0fae26b094d", // HyperSwap V3
    "0x8ffdb06039b1b8188c2c721dc3c435b5773d7346", // KittenSwap
    "0x744489ee3d540777a66f2cf297479745e0852f7a", // LiquidSwap
    "0xe95f6eaeae1e4d650576af600b33d9f7e5f9f7fd", // GlueX
    "0x1EbDFC75FfE3ba3de61E7138a3E8706aC841Af9B", // Project X V1
    "0x9EE0D03BB45268860dd9A72Ab681d36C80ea7974"  // Project X V2
  ];

  const Aggregator = await hre.ethers.getContractFactory("MultiHopAggregator");
  const aggregator = await Aggregator.deploy(
    feeCollector,
    ...routers
  );
  await aggregator.deployed();
  console.log("MultiHopAggregator deployed to:", aggregator.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});