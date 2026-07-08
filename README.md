# A-Suite Crypto — Suite Unificada de 10 Tokens

Suite completa de contratos inteligentes, frontend dApp, exchange dashboard, documentacion tecnica y assets visuales para el ecosistema de 10 tokens A-Suite en Ethereum.

## Ecosistema de Tokens

| # | Ticker | Nombre | Tipo | Serie | Supply |
|---|--------|--------|------|-------|--------|
| 1 | AGOV | A-Gobernanza | Governance | A | 50M |
| 2 | AUTI | A-Utilidad | Utility | A | 100M |
| 3 | APAY | A-Pago | Payment | A | 200M |
| 4 | ARES | A-Reserva | Reserve | A | 150M |
| 5 | A1GOV | A1-Gobernanza | Governance | A1 | 30M |
| 6 | A1UTI | A1-Utilidad | Utility | A1 | 75M |
| 7 | A1PAY | A1-Pago | Payment | A1 | 180M |
| 8 | AXGOV | AX-Gobernanza | Governance | AX | 25M |
| 9 | AXPAY | AX-Pago | Payment | AX | 160M |
| 10 | AXRES | AX-Reserva | Reserve | AX | 120M |
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

**Series:**
- **A** — Serie base: gobernanza, utilidad, pago y reserva
- **A1** — Serie premium/Tier-1: variantes con funcionalidades avanzadas
- **AX** — Serie extendida/cross-chain: operaciones multi-cadena

## Estructura del Proyecto

```
crypto-suite/
├── contracts/              # Contratos Solidity
│   ├── AdvancedToken.sol   #   ERC20 avanzado (burn, pause, permisos)
│   ├── MinerToken.sol      #   Token minero con yield farming
│   ├── GasAccumulator.sol  #   Gestor de reservas de gas
│   ├── NFTCollection.sol   #   Coleccion ERC721
│   ├── NFTMarketplace.sol  #   Marketplace descentralizado
│   ├── CSUITEFaucet.sol    #   Faucet de tokens
│   └── TokenGatedBatchNFT* #   NFT gated por token
├── frontend/               # dApp React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Dashboard principal (wallet)
│   │   │   ├── Exchange.jsx      # A-Suite Exchange (mercado simulado)
│   │   │   ├── TokenSpecs.jsx    # Specs tecnicas de los 10 tokens
│   │   │   ├── Gallery.jsx       # Galeria de assets visuales
│   │   │   ├── Token.jsx         # Gestion de token ERC20
│   │   │   ├── NFTCollection.jsx # Mint de NFTs
│   │   │   ├── Marketplace.jsx   # Compra/venta de NFTs
│   │   │   └── Faucet.jsx        # Faucet de tokens
│   │   ├── data/
│   │   │   └── tokens.js         # Datos unificados de los 10 tokens
│   │   ├── components/
│   │   ├── config/
│   │   ├── contracts/            # ABIs
│   │   └── styles/
│   └── public/
│       └── tokens/               # Imagenes de los 10 tokens
├── scripts/                # Scripts de deployment
├── test/                   # Tests
├── hardhat.config.js       # Config Hardhat
└── package.json
```

## Inicio Rapido

### Requisitos

- Node.js v16+
- npm

### Instalacion

```bash
git clone https://github.com/jacxas/crypto-suite.git
cd crypto-suite
npm install
cp .env.example .env
```

### Contratos (Hardhat)

```bash
npm run compile          # Compilar contratos
npm test                 # Ejecutar tests
npm run node             # Nodo local
npm run deploy:localhost # Deploy local
npm run deploy:sepolia   # Deploy testnet
```

### Frontend (Vite)

```bash
cd frontend
npm install
npm run dev              # Dev server en http://localhost:5173
npm run build            # Build de produccion
```

## Paginas del Frontend

| Ruta | Pagina | Descripcion |
|------|--------|-------------|
| `/` | Dashboard | Balance de wallet, info de contratos desplegados |
| `/exchange` | A-Suite Exchange | Dashboard de mercado con datos simulados de los 10 tokens |
| `/specs` | Token Specs | Documentacion tecnica: arquitectura, riesgos, mitigaciones |
| `/gallery` | Gallery | Galeria visual de los assets de cada token |
| `/token` | Token | Gestion del token ERC20 (transfer, approve, burn) |
| `/nft` | NFT Collection | Mint de NFTs |
| `/marketplace` | Marketplace | Compra y venta de NFTs |
| `/faucet` | Faucet | Obtener tokens de prueba |

## Contratos

| Contrato | Tipo | Descripcion |
|----------|------|-------------|
| AdvancedToken | ERC20 | Token con burn, pause y control de acceso |
| MinerToken | ERC20 | Token minero con yield farming multi-protocolo |
| GasAccumulator | Utility | Gestor de reservas de gas automatico |
| NFTCollection | ERC721 | Coleccion con minting publico y supply cap |
| NFTMarketplace | Exchange | Marketplace NFT con fees configurables |
| CSUITEFaucet | Utility | Distribucion de tokens de prueba |

## Seguridad

- OpenZeppelin para contratos base auditados
- ReentrancyGuard en funciones criticas
- Pausable para emergencias
- Access control con Ownable
- Validacion de inputs y Checks-Effects-Interactions

## Configuracion (.env)

```env
SEPOLIA_RPC_URL=tu_url_rpc
MAINNET_RPC_URL=tu_url_mainnet
POLYGON_RPC_URL=tu_url_polygon
PRIVATE_KEY=tu_clave_privada
ETHERSCAN_API_KEY=tu_api_key
```

## Origen

Este repositorio unifica los siguientes proyectos que originalmente estaban separados:

- **crypto-suite** — Contratos Solidity + frontend React
- **deaboard** — Dashboard de exchange + imagenes de tokens
- **desboard-token** — PWA de documentacion tecnica de tokens
- **Supabase-google-blockchain-web3-project** — Infraestructura backend (concepto)

## Licencia

MIT
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
