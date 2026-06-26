<div align="center">

# 🔐 Crypto Suite

**Suite completa de contratos inteligentes para Ethereum — ERC20, ERC721 y Marketplace**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.x-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.x-yellow?logo=ethereum)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.x-4E5EE4)](https://openzeppelin.com/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia%20%7C%20Mainnet-3C3C3D?logo=ethereum)](https://ethereum.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 🧠 ¿Qué es Crypto Suite?

Crypto Suite es una dApp completa con tres contratos inteligentes auditables para Ethereum: un **token ERC20 avanzado**, una **colección NFT ERC721** y un **marketplace descentralizado**. Diseñado para despliegue en Sepolia testnet y Ethereum mainnet.

## 📜 Contratos

### `AdvancedToken.sol` — ERC20
- Minteo inicial configurable
- Burn (quemar tokens)
- Pause / Unpause de emergencia
- Control de acceso con `Ownable`

### `NFTCollection.sol` — ERC721
- Minting público con precio configurable
- Max supply con protección
- Base URI para metadata IPFS
- Withdraw de fondos del contrato

### `NFTMarketplace.sol`
- Listado de NFTs para venta
- Compra con ETH o tokens ERC20
- Fees del marketplace configurables
- Cancelación y actualización de listings
- `ReentrancyGuard` en funciones críticas

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Contratos | Solidity 0.8.x, OpenZeppelin 5.x |
| Framework | Hardhat 2.x |
| Testing | Chai, Ethers.js |
| Redes | Localhost, Sepolia, Mainnet, Polygon |
| Frontend | JavaScript (Ethers.js) |

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+
- Cuenta con fondos en Sepolia ([Faucet](https://sepoliafaucet.com/))
- API keys: Infura/Alchemy + Etherscan

### Instalación

```bash
git clone https://github.com/jacxas/crypto-suite.git
cd crypto-suite
npm install
cp .env.example .env
```

### Configuración `.env`

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_KEY
PRIVATE_KEY=tu_clave_privada_sin_0x
ETHERSCAN_API_KEY=tu_api_key_etherscan
```

> ⚠️ **NUNCA** commitees tu `PRIVATE_KEY`. Verificá que `.env` esté en `.gitignore`.

## 📦 Scripts

```bash
# Compilar contratos
npm run compile

# Tests completos
npm test

# Nodo local Hardhat
npm run node

# Deploy
npm run deploy:localhost   # Red local
npm run deploy:sepolia     # Sepolia testnet
npm run deploy:mainnet     # Ethereum mainnet
npm run deploy:polygon     # Polygon

# Build completo (compile + test + ABIs)
node build.js
```

## 📁 Estructura del Proyecto

```
crypto-suite/
├── contracts/
│   ├── AdvancedToken.sol      # ERC20 con burn/pause
│   ├── NFTCollection.sol      # ERC721 con minting
│   └── NFTMarketplace.sol     # Marketplace descentralizado
├── scripts/
│   └── deploy.js              # Scripts de deployment
├── test/
│   └── CryptoSuite.test.js    # Tests unitarios e integración
├── assets/metadata/           # Metadata de NFTs
├── build/                     # ABIs compilados
├── hardhat.config.js
└── build.js                   # Script de build completo
```

## 🔒 Seguridad

- Contratos base de **OpenZeppelin** (auditados)
- `ReentrancyGuard` en funciones con transferencias
- `Pausable` para emergencias
- `Ownable` para control de acceso
- Gas optimizado: mínimas operaciones de storage, eventos para datos off-chain

## 🧪 Tests

Cobertura completa incluyendo:
- Deployment de los 3 contratos
- Funcionalidades de token (mint, burn, pause)
- Minting de NFTs y verificación de metadata
- Operaciones de marketplace (list, buy, cancel)
- Manejo de fees y edge cases

## 🤝 Contribuciones

1. Fork el proyecto
2. Creá tu rama: `git checkout -b feature/mi-feature`
3. Commit: `git commit -m 'feat: agregar mi feature'`
4. Push: `git push origin feature/mi-feature`
5. Abrí un Pull Request

## 📄 Licencia

MIT © [jacxas](https://github.com/jacxas)
