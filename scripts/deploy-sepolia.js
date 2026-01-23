// Deploy script for Sepolia testnet
const hre = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying Crypto Suite contracts to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // 1. Deploy CSUITE Token
  console.log("\n📦 Deploying CSUITE Token...");
  const CSUITEToken = await hre.ethers.getContractFactory("AdvancedToken");
  const csuite = await CSUITEToken.deploy(
    "Crypto Suite Token",
    "CSUITE",
    hre.ethers.parseEther("1000000") // 1 million tokens
  );
  await csuite.waitForDeployment();
  const csuiteAddress = await csuite.getAddress();
  console.log("✅ CSUITE Token deployed to:", csuiteAddress);

  // 2. Deploy Staking Contract
  console.log("\n📦 Deploying Staking Contract...");
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(csuiteAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ Staking deployed to:", stakingAddress);

  // 3. Deploy NFT Contract
  console.log("\n📦 Deploying NFT Contract...");
  const NFT = await hre.ethers.getContractFactory("CryptoSuiteNFT");
  const nft = await NFT.deploy("Crypto Suite NFT", "CSNFT");
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ NFT deployed to:", nftAddress);

  // 4. Deploy Liquidity Pool (Yield Farming)
  console.log("\n📦 Deploying Liquidity Pool...");
  const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(csuiteAddress);
  await liquidityPool.waitForDeployment();
  const liquidityPoolAddress = await liquidityPool.getAddress();
  console.log("✅ Liquidity Pool deployed to:", liquidityPoolAddress);

  // 5. Deploy Governance
  console.log("\n📦 Deploying Governance...");
  const Governance = await hre.ethers.getContractFactory("Governance");
  const governance = await Governance.deploy(
    csuiteAddress,
    7 * 24 * 60 * 60, // 7 days voting period
    2 * 24 * 60 * 60, // 2 days timelock
    10 // 10% quorum
  );
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("✅ Governance deployed to:", governanceAddress);

  // 6. Deploy Lending
  console.log("\n📦 Deploying Lending...");
  const Lending = await hre.ethers.getContractFactory("Lending");
  const lending = await Lending.deploy();
  await lending.waitForDeployment();
  const lendingAddress = await lending.getAddress();
  console.log("✅ Lending deployed to:", lendingAddress);

  // 7. Deploy NFT Auction
  console.log("\n📦 Deploying NFT Auction...");
  const NFTAuction = await hre.ethers.getContractFactory("NFTAuction");
  const nftAuction = await NFTAuction.deploy();
  await nftAuction.waitForDeployment();
  const nftAuctionAddress = await nftAuction.getAddress();
  console.log("✅ NFT Auction deployed to:", nftAuctionAddress);

  // 8. Deploy MultiSig
  console.log("\n📦 Deploying MultiSig...");
  const MultiSig = await hre.ethers.getContractFactory("MultiSig");
  const multiSig = await MultiSig.deploy([deployer.address], 1);
  await multiSig.waitForDeployment();
  const multiSigAddress = await multiSig.getAddress();
  console.log("✅ MultiSig deployed to:", multiSigAddress);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log("-".repeat(40));
  console.log("CSUITE Token:    ", csuiteAddress);
  console.log("Staking:         ", stakingAddress);
  console.log("NFT:             ", nftAddress);
  console.log("Liquidity Pool:  ", liquidityPoolAddress);
  console.log("Governance:      ", governanceAddress);
  console.log("Lending:         ", lendingAddress);
  console.log("NFT Auction:     ", nftAuctionAddress);
  console.log("MultiSig:        ", multiSigAddress);
  console.log("-".repeat(40));

  // Save addresses to file
  const fs = require("fs");
  const addresses = {
    network: "sepolia",
    chainId: 11155111,
    deployedAt: new Date().toISOString(),
    contracts: {
      CSUITEToken: csuiteAddress,
      Staking: stakingAddress,
      NFT: nftAddress,
      LiquidityPool: liquidityPoolAddress,
      Governance: governanceAddress,
      Lending: lendingAddress,
      NFTAuction: nftAuctionAddress,
      MultiSig: multiSigAddress
    }
  };

  fs.writeFileSync(
    "./deployed-addresses-sepolia.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n📄 Addresses saved to deployed-addresses-sepolia.json");

  // Verify instructions
  console.log("\n📋 To verify contracts on Etherscan:");
  console.log(`npx hardhat verify --network sepolia ${csuiteAddress} "Crypto Suite Token" "CSUITE" "1000000000000000000000000"`);

  console.log("\n🔗 View on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${csuiteAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
