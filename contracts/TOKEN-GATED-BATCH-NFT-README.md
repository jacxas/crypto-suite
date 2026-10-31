# TokenGatedBatchNFT - Documentación

## Descripción

Contrato de NFTs con sistema de reclamos proporcionales a tokens y revelación en batch usando Chainlink VRF y Automation.

## Características Principales

### 1. Token-Gated Claims (Reclamos por Tokens)
- Los usuarios pueden reclamar NFTs basado en su balance de MinerToken
- Sistema de tiers con diferentes beneficios:

| Tier | Tokens Mínimos | Claims Máximos | Cooldown |
|------|---------------|----------------|----------|
| 0    | 100           | 1              | 24 horas |
| 1    | 500           | 2              | 24 horas |
| 2    | 1,000         | 5              | 24 horas |
| 3    | 5,000         | 10             | 12 horas |
| 4    | 10,000        | 20             | 6 horas  |

### 2. Sistema de Alimentación de NFTs
- Los holders pueden "alimentar" sus NFTs con tokens
- Cada token aumenta el poder del NFT
- El poder determina el nivel del NFT
- Cooldown de 24 horas entre alimentaciones

### 3. Batch Reveal con Chainlink VRF
- Revelación aleatoria verificable en lotes
- Tamaño de batch configurable (default: 100 NFTs)
- Intervalo de revelación configurable (default: 1 hora)

### 4. Chainlink Automation
- Revelación automática sin intervención manual
- Ejecuta reveals cuando se cumple el intervalo

## Instalación

```bash
# Instalar dependencias
npm install

# Compilar contratos
npm run compile
```

## Configuración Pre-Deploy

### 1. Crear Suscripción VRF
1. Ve a [Chainlink VRF](https://vrf.chain.link/)
2. Conecta tu wallet
3. Crea una nueva suscripción
4. Fondea la suscripción con LINK
5. Copia el Subscription ID

### 2. Configurar Variables de Entorno

Crea un archivo `.env`:

```env
PRIVATE_KEY=tu_private_key
MINER_TOKEN_ADDRESS=direccion_de_tu_miner_token
VRF_SUBSCRIPTION_ID=tu_subscription_id
```

### 3. Actualizar Script de Deploy

Edita `scripts/deployTokenGatedBatchNFT.js` y actualiza:
- `subscriptionId` para tu red
- `MINER_TOKEN_ADDRESS` si no usas variable de entorno

## Deploy

```bash
# Deploy en Sepolia testnet
npx hardhat run scripts/deployTokenGatedBatchNFT.js --network sepolia

# Deploy en Polygon
npx hardhat run scripts/deployTokenGatedBatchNFT.js --network polygon
```

## Post-Deploy

### 1. Agregar Consumer a VRF
1. Ve a [Chainlink VRF](https://vrf.chain.link/)
2. Selecciona tu suscripción
3. Click en "Add Consumer"
4. Ingresa la dirección del contrato desplegado

### 2. Registrar en Automation
1. Ve a [Chainlink Automation](https://automation.chain.link/)
2. Click en "Register new Upkeep"
3. Selecciona "Custom logic"
4. Ingresa la dirección del contrato
5. Fondea con LINK

### 3. Configurar URIs

```javascript
// Configurar URI base para metadata revelada
await contract.setBaseURI("https://tu-api.com/metadata/");

// Configurar URI para NFTs no revelados
await contract.setUnrevealedURI("https://tu-api.com/unrevealed.json");
```

## Funciones Principales

### Para Usuarios

```solidity
// Reclamar NFTs (según tier)
function claim(uint256 quantity) external

// Alimentar NFT con tokens
function feedNFT(uint256 tokenId, uint256 amount) external

// Ver tier del usuario
function getUserTier(address user) external view returns (...)

// Ver estadísticas de claim
function getUserClaimStats(address user) external view returns (...)

// Ver info de NFT
function getNFTInfo(uint256 tokenId) external view returns (...)
```

### Para Owner

```solidity
// Solicitar reveal manual
function requestBatchReveal() external onlyOwner

// Configurar tiers
function addClaimTier(uint256 minTokens, uint256 maxClaims, uint256 cooldown) external onlyOwner
function updateClaimTier(uint256 tierIndex, ...) external onlyOwner

// Configurar reveal
function setRevealBatchSize(uint256 newBatchSize) external onlyOwner
function setRevealInterval(uint256 newInterval) external onlyOwner

// Configurar alimentación
function setFeedConfig(uint256 cooldown, uint256 powerPerToken, uint256 maxPower) external onlyOwner

// Retirar tokens acumulados
function withdrawTokens(address to, uint256 amount) external onlyOwner
```

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐
│   MinerToken    │─────│ TokenGatedBatch │
│   (ERC20)       │     │     NFT         │
└─────────────────┘     └───────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────┴─────────┐ ┌───────┴─────────┐ ┌───────┴─────────┐
│  Chainlink VRF  │ │   Chainlink    │ │   Chainlink    │
│  (Aleatoriedad) │ │   Automation   │ │   Faucet       │
└─────────────────┘ └────────────────┘ └────────────────┘
```

## Flujo de Usuario

1. **Adquirir MinerTokens** - Comprar o minar tokens
2. **Reclamar NFTs** - Usar `claim()` según tu tier
3. **Esperar Reveal** - Automation revela automáticamente
4. **Alimentar NFTs** - Usar `feedNFT()` para aumentar poder
5. **Subir de Nivel** - El poder determina el nivel

## Costos de Gas Estimados

| Función | Gas Estimado |
|---------|-------------|
| claim(1) | ~150,000 |
| claim(5) | ~400,000 |
| feedNFT | ~80,000 |
| requestBatchReveal | ~100,000 |

## Seguridad

- ReentrancyGuard en funciones críticas
- Validaciones de ownership
- Cooldowns para prevenir spam
- VRF para aleatoriedad verificable

## Licencia

MIT
