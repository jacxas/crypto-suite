const hre = require("hardhat");

async function main() {
  console.log("\n🚰 Desplegando CSUITEFaucet...\n");

  // Dirección del token CSUITE (actualizar con la dirección real)
  // Si no tienes un token, primero despliega AdvancedToken.sol
  const TOKEN_ADDRESS = process.env.CSUITE_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  if (TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.log("⚠️  No se encontró dirección del token.");
    console.log("   Primero despliega el token y luego ejecuta:");
    console.log("   CSUITE_TOKEN_ADDRESS=0x... npx hardhat run scripts/deploy-faucet.js --network sepolia\n");
    
    // Desplegar token de prueba
    console.log("🪙 Desplegando token de prueba...");
    const Token = await hre.ethers.getContractFactory("AdvancedToken");
    const token = await Token.deploy(
      "CSUITE Token",
      "CSUITE",
      hre.ethers.parseEther("1000000000"), // 1 billion
      18
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`✅ Token desplegado en: ${tokenAddress}`);
    
    // Desplegar faucet con el token
    console.log("\n🚰 Desplegando Faucet...");
    const Faucet = await hre.ethers.getContractFactory("CSUITEFaucet");
    const faucet = await Faucet.deploy(tokenAddress);
    await faucet.waitForDeployment();
    const faucetAddress = await faucet.getAddress();
    console.log(`✅ Faucet desplegado en: ${faucetAddress}`);
    
    // Transferir tokens al faucet
    console.log("\n💰 Transfiriendo tokens al faucet...");
    const fundAmount = hre.ethers.parseEther("10000000"); // 10 millones
    await token.transfer(faucetAddress, fundAmount);
    console.log(`✅ Transferidos ${hre.ethers.formatEther(fundAmount)} CSUITE al faucet`);
    
    console.log("\n" + "=".repeat(50));
    console.log("🎉 DESPLIEGUE COMPLETADO");
    console.log("=".repeat(50));
    console.log(`Token:  ${tokenAddress}`);
    console.log(`Faucet: ${faucetAddress}`);
    console.log("=".repeat(50));
    console.log("\n📝 Actualiza FAUCET_ADDRESS en Faucet.jsx con:");
    console.log(`   const FAUCET_ADDRESS = '${faucetAddress}';\n`);
    
    return;
  }

  // Desplegar faucet con token existente
  console.log(`🪙 Usando token: ${TOKEN_ADDRESS}`);
  
  const Faucet = await hre.ethers.getContractFactory("CSUITEFaucet");
  const faucet = await Faucet.deploy(TOKEN_ADDRESS);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  
  console.log("\n" + "=".repeat(50));
  console.log("🎉 FAUCET DESPLEGADO");
  console.log("=".repeat(50));
  console.log(`Faucet: ${faucetAddress}`);
  console.log("=".repeat(50));
  console.log("\n⚠️  Recuerda transferir tokens al faucet:");
  console.log(`   token.transfer("${faucetAddress}", amount)\n`);
  console.log("📝 Actualiza FAUCET_ADDRESS en Faucet.jsx con:");
  console.log(`   const FAUCET_ADDRESS = '${faucetAddress}';\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
