// Script de deploy para TokenGatedBatchNFT
const hre = require("hardhat");

// Configuración de Chainlink VRF por red
const VRF_CONFIG = {
    // Sepolia Testnet
    sepolia: {
        vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit: 500000,
        // Nota: Debes crear tu propia suscripción en https://vrf.chain.link/
        subscriptionId: 0 // REEMPLAZAR con tu subscription ID
    },
    // Polygon Mumbai Testnet
    mumbai: {
        vrfCoordinator: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        callbackGasLimit: 500000,
        subscriptionId: 0 // REEMPLAZAR con tu subscription ID
    },
    // Polygon Mainnet
    polygon: {
        vrfCoordinator: "0xAE975071Be8F8eE67addBC1A82488F1C24858067",
        gasLane: "0xcc294a196eeeb44da2888d17c0625cc88d70d9760a69d58d853ba6581a9ab0cd",
        callbackGasLimit: 500000,
        subscriptionId: 0 // REEMPLAZAR con tu subscription ID
    },
    // Ethereum Mainnet
    mainnet: {
        vrfCoordinator: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
        gasLane: "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef",
        callbackGasLimit: 500000,
        subscriptionId: 0 // REEMPLAZAR con tu subscription ID
    },
    // Localhost (para testing)
    localhost: {
        vrfCoordinator: "0x0000000000000000000000000000000000000000", // Mock
        gasLane: "0x0000000000000000000000000000000000000000000000000000000000000000",
        callbackGasLimit: 500000,
        subscriptionId: 1
    }
};

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const network = hre.network.name;
    
    console.log("\n========================================");
    console.log("  TokenGatedBatchNFT Deployment Script");
    console.log("========================================\n");
    console.log("Deploying to network:", network);
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", hre.ethers.utils.formatEther(await deployer.getBalance()), "ETH");
    
    // Obtener configuración VRF para la red
    const vrfConfig = VRF_CONFIG[network];
    if (!vrfConfig) {
        throw new Error(`No VRF configuration found for network: ${network}`);
    }
    
    if (vrfConfig.subscriptionId === 0 && network !== "localhost") {
        console.log("\n⚠️  ADVERTENCIA: subscriptionId es 0");
        console.log("   Debes crear una suscripción VRF en https://vrf.chain.link/");
        console.log("   y actualizar el subscriptionId en este script.\n");
    }
    
    // Configuración del contrato
    const NFT_NAME = "CryptoSuite Batch NFT";
    const NFT_SYMBOL = "CSBATCH";
    const MAX_SUPPLY = 10000;
    
    // Dirección del MinerToken (debe estar desplegado primero)
    // REEMPLAZAR con la dirección real de tu MinerToken
    const MINER_TOKEN_ADDRESS = process.env.MINER_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
    
    if (MINER_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
        console.log("\n⚠️  ADVERTENCIA: MINER_TOKEN_ADDRESS no está configurado");
        console.log("   Configura la variable de entorno MINER_TOKEN_ADDRESS");
        console.log("   o actualiza este script con la dirección correcta.\n");
    }
    
    console.log("\nParámetros de deploy:");
    console.log("- Nombre:", NFT_NAME);
    console.log("- Símbolo:", NFT_SYMBOL);
    console.log("- Max Supply:", MAX_SUPPLY);
    console.log("- Governance Token:", MINER_TOKEN_ADDRESS);
    console.log("- VRF Coordinator:", vrfConfig.vrfCoordinator);
    console.log("- Subscription ID:", vrfConfig.subscriptionId);
    console.log("- Gas Lane:", vrfConfig.gasLane);
    console.log("- Callback Gas Limit:", vrfConfig.callbackGasLimit);
    
    // Deploy del contrato
    console.log("\nDesplegando TokenGatedBatchNFT...");
    
    const TokenGatedBatchNFT = await hre.ethers.getContractFactory("TokenGatedBatchNFT");
    const nft = await TokenGatedBatchNFT.deploy(
        NFT_NAME,
        NFT_SYMBOL,
        MINER_TOKEN_ADDRESS,
        MAX_SUPPLY,
        vrfConfig.vrfCoordinator,
        vrfConfig.subscriptionId,
        vrfConfig.gasLane,
        vrfConfig.callbackGasLimit
    );
    
    await nft.deployed();
    
    console.log("\n✅ TokenGatedBatchNFT desplegado en:", nft.address);
    
    // Mostrar información post-deploy
    console.log("\n========================================");
    console.log("  Pasos siguientes:");
    console.log("========================================");
    console.log("\n1. Agregar el contrato como consumer en tu suscripción VRF:");
    console.log("   - Ve a https://vrf.chain.link/");
    console.log("   - Selecciona tu suscripción");
    console.log("   - Agrega este contrato como consumer:", nft.address);
    
    console.log("\n2. Registrar el contrato en Chainlink Automation:");
    console.log("   - Ve a https://automation.chain.link/");
    console.log("   - Crea un nuevo Upkeep");
    console.log("   - Selecciona 'Custom logic'");
    console.log("   - Ingresa la dirección del contrato:", nft.address);
    
    console.log("\n3. Configurar URIs:");
    console.log("   - Llama a setBaseURI() con tu URI de metadata");
    console.log("   - Llama a setUnrevealedURI() con tu URI de placeholder");
    
    console.log("\n4. Verificar el contrato en Etherscan:");
    console.log(`   npx hardhat verify --network ${network} ${nft.address} "${NFT_NAME}" "${NFT_SYMBOL}" "${MINER_TOKEN_ADDRESS}" ${MAX_SUPPLY} "${vrfConfig.vrfCoordinator}" ${vrfConfig.subscriptionId} "${vrfConfig.gasLane}" ${vrfConfig.callbackGasLimit}`);
    
    // Guardar dirección en archivo
    const fs = require("fs");
    const deploymentInfo = {
        network: network,
        contractName: "TokenGatedBatchNFT",
        address: nft.address,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        parameters: {
            name: NFT_NAME,
            symbol: NFT_SYMBOL,
            maxSupply: MAX_SUPPLY,
            governanceToken: MINER_TOKEN_ADDRESS,
            vrfCoordinator: vrfConfig.vrfCoordinator,
            subscriptionId: vrfConfig.subscriptionId
        }
    };
    
    const deploymentsDir = "./deployments";
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }
    
    fs.writeFileSync(
        `${deploymentsDir}/TokenGatedBatchNFT-${network}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log(`\n💾 Información de deploy guardada en: ${deploymentsDir}/TokenGatedBatchNFT-${network}.json`);
    console.log("\n========================================\n");
    
    return nft.address;
}

main()
    .then((address) => {
        console.log("Deploy completado exitosamente!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error en deploy:", error);
        process.exit(1);
    });
