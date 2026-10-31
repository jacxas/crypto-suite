// scripts/deploy-miner.js
// Script de deployment para MinerToken y GasAccumulator

const hre = require("hardhat");

// Direcciones de routers por red
const ROUTERS = {
    // Ethereum Mainnet
    mainnet: {
        uniswap: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    },
    // Sepolia Testnet
    sepolia: {
        uniswap: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
        weth: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"
    },
    // Polygon Mainnet
    polygon: {
        quickswap: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
        wmatic: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"
    },
    // Mumbai Testnet
    mumbai: {
        quickswap: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
        wmatic: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"
    },
    // Base Mainnet
    base: {
        aerodrome: "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43",
        weth: "0x4200000000000000000000000000000000000006"
    },
    // Arbitrum One
    arbitrum: {
        camelot: "0xc873fEcbd354f5A56E00E710B90EF4201db2448d",
        weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
    },
    // Localhost (Hardhat)
    localhost: {
        router: "0x0000000000000000000000000000000000000000", // Mock
        weth: "0x0000000000000000000000000000000000000000"   // Mock
    }
};

// Protocolos de yield por red
const YIELD_PROTOCOLS = {
    mainnet: [
        { name: "Lido", address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", rewardToken: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", minDeposit: "100000000000000000", risk: 2 },
        { name: "Aave V3", address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", rewardToken: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", minDeposit: "10000000000000000", risk: 3 },
        { name: "Compound V3", address: "0xc3d688B66703497DAA19211EEdff47f25384cdc3", rewardToken: "0xc00e94Cb662C3520282E6f5717214004A7f26888", minDeposit: "10000000000000000", risk: 3 }
    ],
    polygon: [
        { name: "Aave V3 Polygon", address: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", rewardToken: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B", minDeposit: "1000000000000000000", risk: 3 },
        { name: "QuickSwap", address: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", rewardToken: "0x831753DD7087CaC61aB5644b308642cc1c33Dc13", minDeposit: "1000000000000000000", risk: 5 }
    ],
    base: [
        { name: "Aerodrome", address: "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43", rewardToken: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", minDeposit: "10000000000000000", risk: 4 }
    ],
    arbitrum: [
        { name: "GMX", address: "0xA906F338CB21815cBc4Bc87ace9e68c87eF8d8F1", rewardToken: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", minDeposit: "10000000000000000", risk: 6 },
        { name: "Camelot", address: "0x6BC938abA940fB828D39Daa23A94dfc522120C11", rewardToken: "0x3d9907F9a368ad0a51Be60f7Da3b97cf940982D8", minDeposit: "10000000000000000", risk: 5 }
    ]
};

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const network = hre.network.name;
    
    console.log("\n" + "=".repeat(60));
    console.log("⛏️  MINER TOKEN DEPLOYMENT SCRIPT");
    console.log("=".repeat(60));
    console.log(`\n📍 Network: ${network}`);
    console.log(`👤 Deployer: ${deployer.address}`);
    
    const balance = await deployer.getBalance();
    console.log(`💰 Balance: ${hre.ethers.utils.formatEther(balance)} ETH\n`);
    
    // Obtener configuración de red
    const routerConfig = ROUTERS[network] || ROUTERS.localhost;
    const router = routerConfig.uniswap || routerConfig.quickswap || routerConfig.aerodrome || routerConfig.camelot || routerConfig.router;
    const wrappedNative = routerConfig.weth || routerConfig.wmatic;
    
    console.log(`🔄 Router: ${router}`);
    console.log(`💵 Wrapped Native: ${wrappedNative}\n`);
    
    // ============ DEPLOY MINER TOKEN ============
    console.log("-".repeat(60));
    console.log("🚀 Deploying MinerToken...");
    
    const MinerToken = await hre.ethers.getContractFactory("MinerToken");
    const initialSupply = hre.ethers.utils.parseEther("1000000"); // 1M tokens
    
    const minerToken = await MinerToken.deploy(
        "MinerToken",
        "MINER",
        initialSupply,
        router,
        wrappedNative
    );
    
    await minerToken.deployed();
    console.log(`✅ MinerToken deployed to: ${minerToken.address}`);
    
    // ============ DEPLOY GAS ACCUMULATOR ============
    console.log("\n🚀 Deploying GasAccumulator...");
    
    const GasAccumulator = await hre.ethers.getContractFactory("GasAccumulator");
    const gasAccumulator = await GasAccumulator.deploy(router, wrappedNative);
    
    await gasAccumulator.deployed();
    console.log(`✅ GasAccumulator deployed to: ${gasAccumulator.address}`);
    
    // ============ CONFIGURACIÓN INICIAL ============
    console.log("\n" + "-".repeat(60));
    console.log("⚙️  Configuring contracts...");
    
    // Agregar MinerToken como token soportado en GasAccumulator
    const addTokenTx = await gasAccumulator.addSupportedToken(minerToken.address);
    await addTokenTx.wait();
    console.log("✅ MinerToken added to GasAccumulator supported tokens");
    
    // Agregar protocolos de yield si están disponibles para esta red
    const protocols = YIELD_PROTOCOLS[network];
    if (protocols && protocols.length > 0) {
        console.log(`\n📊 Adding ${protocols.length} yield protocols...`);
        
        for (const protocol of protocols) {
            try {
                const tx = await minerToken.addProtocol(
                    protocol.address,
                    protocol.name,
                    protocol.rewardToken,
                    protocol.minDeposit,
                    protocol.risk
                );
                await tx.wait();
                console.log(`   ✅ ${protocol.name} added (risk: ${protocol.risk}/10)`);
            } catch (error) {
                console.log(`   ⚠️  Failed to add ${protocol.name}: ${error.message}`);
            }
        }
    } else {
        console.log("\n⚠️  No yield protocols configured for this network");
        console.log("   Add protocols manually using minerToken.addProtocol()");
    }
    
    // ============ RESUMEN ============
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log(`
📝 Contract Addresses:
`);
    console.log(`   MinerToken:      ${minerToken.address}`);
    console.log(`   GasAccumulator:  ${gasAccumulator.address}`);
    console.log(`
📊 Token Info:
`);
    console.log(`   Name:            MinerToken`);
    console.log(`   Symbol:          MINER`);
    console.log(`   Initial Supply:  1,000,000 MINER`);
    console.log(`   Gas Reserve:     10%`);
    
    // ============ VERIFICACIÓN EN ETHERSCAN ============
    if (network !== "localhost" && network !== "hardhat") {
        console.log("\n" + "-".repeat(60));
        console.log("🔍 Verification commands:\n");
        console.log(`npx hardhat verify --network ${network} ${minerToken.address} "MinerToken" "MINER" "${initialSupply.toString()}" "${router}" "${wrappedNative}"`);
        console.log(`\nnpx hardhat verify --network ${network} ${gasAccumulator.address} "${router}" "${wrappedNative}"`);
    }
    
    // ============ GUARDAR DIRECCIONES ============
    const fs = require("fs");
    const deploymentInfo = {
        network: network,
        timestamp: new Date().toISOString(),
        contracts: {
            MinerToken: minerToken.address,
            GasAccumulator: gasAccumulator.address
        },
        config: {
            router: router,
            wrappedNative: wrappedNative,
            initialSupply: initialSupply.toString()
        }
    };
    
    const deploymentPath = `./deployments/${network}-miner.json`;
    
    // Crear directorio si no existe
    if (!fs.existsSync("./deployments")) {
        fs.mkdirSync("./deployments");
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
    
    console.log("\n" + "=".repeat(60));
    console.log("🚀 Ready to mine! Use the following to start:");
    console.log("=".repeat(60));
    console.log(`
1. Approve tokens:
   minerToken.approve(PROTOCOL_ADDRESS, amount)

2. Start mining:
   minerToken.startMining(PROTOCOL_ADDRESS, amount)

3. Claim rewards:
   minerToken.claimRewards()

4. Auto-compound:
   minerToken.autoCompound()
`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
