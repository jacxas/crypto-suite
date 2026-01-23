const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n=== Iniciando deployment de Crypto Suite ===");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDeployando contratos con la cuenta:", deployer.address);
  console.log("Balance de la cuenta:", (await deployer.getBalance()).toString());

  // Deploy AdvancedToken
  console.log("\n--- Deployando AdvancedToken ---");
  const AdvancedToken = await hre.ethers.getContractFactory("AdvancedToken");
  const token = await AdvancedToken.deploy(
    "CryptoSuite Token",
    "CST",
    hre.ethers.utils.parseEther("1000000") // 1 millón de tokens
  );
  await token.deployed();
  console.log("AdvancedToken deployed to:", token.address);

  // Deploy NFTCollection
  console.log("\n--- Deployando NFTCollection ---");
  const NFTCollection = await hre.ethers.getContractFactory("NFTCollection");
  const nftCollection = await NFTCollection.deploy(
    "CryptoSuite NFT",
    "CSNFT",
    "https://api.cryptosuite.com/metadata/",
    hre.ethers.utils.parseEther("0.01"), // 0.01 ETH mint price
    100 // max supply
  );
  await nftCollection.deployed();
  console.log("NFTCollection deployed to:", nftCollection.address);

  // Deploy NFTMarketplace
  console.log("\n--- Deployando NFTMarketplace ---");
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy();
  await marketplace.deployed();
  console.log("NFTMarketplace deployed to:", marketplace.address);

  // Guardar direcciones
  const addresses = {
    AdvancedToken: token.address,
    NFTCollection: nftCollection.address,
    NFTMarketplace: marketplace.address,
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(addresses, null, 2)
  );

  console.log("\n=== Deployment completado ===");
  console.log("Direcciones guardadas en:", path.join(deploymentsDir, filename));
  console.log("\nResumen:");
  console.log(JSON.stringify(addresses, null, 2));

  // Verificar contratos en Etherscan (si no es localhost)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n--- Esperando confirmaciones para verificación ---");
    await token.deployTransaction.wait(6);
    await nftCollection.deployTransaction.wait(6);
    await marketplace.deployTransaction.wait(6);

    console.log("\n--- Verificando contratos en Etherscan ---");
    
    try {
      await hre.run("verify:verify", {
        address: token.address,
        constructorArguments: [
          "CryptoSuite Token",
          "CST",
          hre.ethers.utils.parseEther("1000000")
        ],
      });
      console.log("AdvancedToken verificado");
    } catch (error) {
      console.log("Error verificando AdvancedToken:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: nftCollection.address,
        constructorArguments: [
          "CryptoSuite NFT",
          "CSNFT",
          "https://api.cryptosuite.com/metadata/",
          hre.ethers.utils.parseEther("0.01"),
          100
        ],
      });
      console.log("NFTCollection verificado");
    } catch (error) {
      console.log("Error verificando NFTCollection:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: marketplace.address,
        constructorArguments: [],
      });
      console.log("NFTMarketplace verificado");
    } catch (error) {
      console.log("Error verificando NFTMarketplace:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
