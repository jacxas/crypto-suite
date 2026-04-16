# Setup Guide - Crypto Suite

Suite completa de contratos inteligentes para criptomonedas y NFTs.

## Requisitos Previos

- Node.js 16+
- npm o yarn
- Hardhat CLI (se instala con npm)

## Instalación

### 1. Clonar Repositorio
```bash
git clone https://github.com/jacxas/crypto-suite.git
cd crypto-suite
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env
```

Editar `.env` con tus valores:

#### RPC URLs (Alchemy o Infura)
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
```

#### Private Key (NUNCA commitear a git)
```
PRIVATE_KEY=your_private_key_without_0x_prefix
```

#### API Keys (para verificación de contratos)
```
ETHERSCAN_API_KEY=your_etherscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key
```

## Compilar Contratos

```bash
npm run compile
```

## Ejecutar Tests

```bash
npm test
```

## Desplegar Contratos

### En Red Local (Hardhat)
```bash
npm run node
# En otra terminal:
npm run deploy:localhost
```

### En Sepolia (Testnet)
```bash
npm run deploy:sepolia
```

### En Mainnet (CUIDADO!)
```bash
npm run deploy:mainnet
```

### En Polygon
```bash
npm run deploy:polygon
```

## Contratos Incluidos

### 1. AdvancedToken (ERC20)
- Token estándar ERC20
- Mint/Burn
- Pausable

### 2. NFTCollection (ERC721)
- NFT estándar ERC721
- Metadata URI
- Mint controlado

### 3. NFTMarketplace
- Compra/Venta de NFTs
- Ofertas
- Comisiones

## Scripts Disponibles

```bash
npm run compile      # Compilar contratos
npm run test         # Ejecutar tests
npm run coverage     # Cobertura de tests
npm run node         # Ejecutar nodo local
npm run clean        # Limpiar artefactos
npm run deploy:*     # Desplegar en diferentes redes
```

## Estructura del Proyecto

```
crypto-suite/
├── contracts/          # Contratos Solidity
├── scripts/           # Scripts de deploy
├── test/              # Tests
├── artifacts/         # Compilados (generado)
├── hardhat.config.js  # Configuración
└── .env              # Variables de entorno
```

## Troubleshooting

### Error: "PRIVATE_KEY not found"
- Verificar que `.env` existe
- Verificar que `PRIVATE_KEY` está configurada
- No incluir el prefijo `0x`

### Error: "RPC connection failed"
- Verificar que la URL de RPC es correcta
- Verificar que tienes acceso a Alchemy/Infura
- Verificar que la red está disponible

### Error: "Insufficient funds"
- Asegúrate de tener ETH en la cuenta
- En testnet, usa un faucet

### Error: "Contract verification failed"
- Verificar que `ETHERSCAN_API_KEY` es correcto
- Esperar 30 segundos después del deploy
- Verificar que el contrato está en Etherscan

## Documentación

- [Hardhat](https://hardhat.org/docs)
- [Solidity](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js](https://docs.ethers.org/)

## Redes Soportadas

| Red | Chain ID | RPC |
|-----|----------|-----|
| Sepolia | 11155111 | https://eth-sepolia.g.alchemy.com/v2/ |
| Mainnet | 1 | https://eth-mainnet.g.alchemy.com/v2/ |
| Polygon | 137 | https://polygon-mainnet.g.alchemy.com/v2/ |
| Mumbai | 80001 | https://polygon-mumbai.g.alchemy.com/v2/ |

## Seguridad

⚠️ **IMPORTANTE:**
- NUNCA commitear `.env` a git
- NUNCA compartir tu `PRIVATE_KEY`
- Usar cuentas separadas para mainnet
- Auditar contratos antes de producción
