// scripts/deploy-asuite.cjs
// Despliega los 10 tokens de la A-Suite y guarda las direcciones.
//
// Uso:
//   npx hardhat run scripts/deploy-asuite.cjs --network hardhat    (local)
//   npx hardhat run scripts/deploy-asuite.cjs --network sepolia
//
// Escribe dos ficheros:
//   deployments/asuite-<chainId>.json          (registro por red)
//   frontend/src/data/asuite-addresses.json    (lo que consume el frontend)

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const TOKENS = [
  "AGOV",
  "AUTI",
  "APAY",
  "ARES",
  "A1GOV",
  "A1UTI",
  "A1PAY",
  "AXGOV",
  "AXPAY",
  "AXRES",
];

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const red = await hre.ethers.provider.getNetwork();
  const chainId = red.chainId.toString();

  console.log("A-Suite - despliegue de los 10 tokens");
  console.log("Red:", chainId, "| Cuenta:", deployer.address);

  if (chainId === "31337") {
    console.log("");
    console.log("AVISO: la red `hardhat` es EFIMERA.");
    console.log("       Los contratos viven solo mientras corre este script,");
    console.log("       asi que estas direcciones NO sirven despues.");
    console.log("       Para un despliegue local que persista:");
    console.log("         npx hardhat node   (en otra terminal)");
    console.log("         npx hardhat run scripts/deploy-asuite.cjs --network localhost");
  }
  console.log("");

  const direcciones = {};

  for (const ticker of TOKENS) {
    const Factory = await hre.ethers.getContractFactory(ticker);
    const contrato = await Factory.deploy();
    await contrato.waitForDeployment();

    const direccion = await contrato.getAddress();
    const supply = await contrato.totalSupply();
    direcciones[ticker] = direccion;

    console.log(
      "  " +
        ticker.padEnd(6) +
        " " +
        direccion +
        "   supply " +
        hre.ethers.formatEther(supply)
    );
  }

  // Registro por red
  const carpeta = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(carpeta, { recursive: true });
  const registro = path.join(carpeta, "asuite-" + chainId + ".json");
  fs.writeFileSync(
    registro,
    JSON.stringify(
      { chainId: chainId, deployer: deployer.address, tokens: direcciones },
      null,
      2
    ) + "\n"
  );
  console.log("\nRegistro guardado en " + registro);

  // Direcciones para el frontend (sin variables de entorno de por medio)
  const fe = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "data",
    "asuite-addresses.json"
  );
  let actual = {};
  if (fs.existsSync(fe)) {
    actual = JSON.parse(fs.readFileSync(fe, "utf8"));
  }
  actual[chainId] = direcciones;
  fs.writeFileSync(fe, JSON.stringify(actual, null, 2) + "\n");
  console.log("Direcciones del frontend actualizadas en " + fe);

  console.log("\nA-Suite desplegada. 10 tokens.");
}

main().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
