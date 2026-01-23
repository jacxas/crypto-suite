# ⛏️ MinerToken - Sistema de Tokens Mineros Unificados

## 🎯 Visión General

MinerToken es un sistema de tokens ERC20 con capacidades de minería multi-protocolo que:

1. **Mina** diferentes criptomonedas automáticamente
2. **Acumula** ganancias para pagar gas
3. **Se integra** con múltiples plataformas de yield farming

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                      MinerToken.sol                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Atributos de Minería:                                   │  │
│  │  - miningPower (1-100)                                   │  │
│  │  - aiLevel (1-10)                                        │  │
│  │  - activeProtocol                                        │  │
│  │  - gasReserve                                            │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   GasAccumulator.sol    │     │   Yield Protocols       │
│                         │     │                         │
│  - Acumula gas          │     │  - Lido (stETH)         │
│  - Convierte a ETH      │     │  - Aave V3              │
│  - Auto top-up          │     │  - Compound V3          │
│  - Tareas automáticas   │     │  - Yearn Finance        │
└─────────────────────────┘     │  - QuickSwap            │
                                │  - Aerodrome            │
                                │  - GMX / Camelot        │
                                └─────────────────────────┘
```

## 📦 Contratos

### MinerToken.sol
Token ERC20 principal con funcionalidades de minería:

| Función | Descripción |
|---------|-------------|
| `startMining(protocol, amount)` | Inicia minería en un protocolo |
| `stopMining(amount)` | Detiene minería y retira fondos |
| `claimRewards()` | Reclama recompensas acumuladas |
| `autoCompound()` | Reinvierte recompensas automáticamente |
| `upgradeAttributes(power, ai)` | Mejora atributos quemando tokens |
| `convertGasToNative(amount)` | Convierte reserva de gas a ETH |

### GasAccumulator.sol
Gestor de reservas de gas:

| Función | Descripción |
|---------|-------------|
| `depositGas()` | Deposita ETH para gas |
| `depositTokensForGas(token, amount)` | Convierte tokens a ETH |
| `withdrawGas(amount)` | Retira ETH de la reserva |
| `createAutoTask(...)` | Crea tarea automática |
| `autoTopUp(user, amount)` | Recarga automática de gas |

## 🚀 Instalación y Deployment

### 1. Instalar dependencias
```bash
cd crypto-suite
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tu PRIVATE_KEY y API keys
```

### 3. Compilar contratos
```bash
npx hardhat compile
```

### 4. Deploy a testnet (Sepolia)
```bash
npx hardhat run scripts/deploy-miner.js --network sepolia
```

### 5. Deploy a mainnet
```bash
npx hardhat run scripts/deploy-miner.js --network mainnet
```

## 📊 Atributos de Minería

### Mining Power (1-100)
- Aumenta las recompensas base
- Fórmula: `rewards * miningPower / 100`
- Costo de mejora: `powerIncrease * (currentPower + 1) tokens`

### AI Level (1-10)
- Boost multiplicador de recompensas
- Fórmula: `rewards * aiLevel * 1.5 / 10`
- Costo de mejora: `aiIncrease * (currentLevel + 1) * 50 tokens`

### Gas Reserve
- 10% de cada recompensa se reserva para gas
- Puede convertirse a ETH nativo
- Permite operaciones automáticas sin intervención

## 🔌 Protocolos Soportados

### Ethereum Mainnet
| Protocolo | Tipo | Riesgo | APY Estimado |
|-----------|------|--------|-------------|
| Lido | Staking Líquido | ⭐⭐ | 3-5% |
| Aave V3 | Lending | ⭐⭐⭐ | 2-8% |
| Compound V3 | Lending | ⭐⭐⭐ | 2-6% |
| Yearn | Vaults | ⭐⭐⭐⭐ | 5-15% |

### Polygon
| Protocolo | Tipo | Riesgo | APY Estimado |
|-----------|------|--------|-------------|
| Aave V3 | Lending | ⭐⭐⭐ | 3-10% |
| QuickSwap | LP Farming | ⭐⭐⭐⭐⭐ | 10-50% |

### Base
| Protocolo | Tipo | Riesgo | APY Estimado |
|-----------|------|--------|-------------|
| Aerodrome | DEX/LP | ⭐⭐⭐⭐ | 15-100% |

### Arbitrum
| Protocolo | Tipo | Riesgo | APY Estimado |
|-----------|------|--------|-------------|
| GMX | Perpetuals | ⭐⭐⭐⭐⭐⭐ | 10-30% |
| Camelot | DEX/LP | ⭐⭐⭐⭐⭐ | 20-80% |

## 💻 Ejemplo de Uso

```javascript
const { ethers } = require("ethers");

// Conectar al contrato
const minerToken = new ethers.Contract(MINER_ADDRESS, MINER_ABI, signer);

// 1. Aprobar tokens para el protocolo
await minerToken.approve(AAVE_ADDRESS, ethers.utils.parseEther("1000"));

// 2. Iniciar minería
await minerToken.startMining(AAVE_ADDRESS, ethers.utils.parseEther("1000"));

// 3. Ver recompensas pendientes
const pending = await minerToken.pendingRewards(myAddress);
console.log(`Pending: ${ethers.utils.formatEther(pending)} MINER`);

// 4. Reclamar recompensas
await minerToken.claimRewards();

// 5. Auto-compound
await minerToken.autoCompound();

// 6. Mejorar atributos
await minerToken.upgradeAttributes(10, 2); // +10 power, +2 AI level

// 7. Ver info del minero
const info = await minerToken.getMinerInfo(myAddress);
console.log(`Power: ${info.miningPower}, AI: ${info.aiLevel}`);
```

## 🔒 Seguridad

### Medidas Implementadas
- ✅ ReentrancyGuard en todas las funciones críticas
- ✅ Pausable para emergencias
- ✅ Ownable para funciones administrativas
- ✅ Validación de inputs
- ✅ Checks-Effects-Interactions pattern

### Recomendaciones
1. **Auditar** antes de mainnet
2. **Testear** exhaustivamente en testnet
3. **Monitorear** eventos y transacciones
4. **Usar** hardware wallet para grandes cantidades

## 📈 Roadmap

### Fase 1: MVP ✅
- [x] Contrato MinerToken
- [x] Contrato GasAccumulator
- [x] Script de deployment
- [x] Documentación

### Fase 2: Integraciones
- [ ] Chainlink Automation para auto-compound
- [ ] Gelato Network para tareas programadas
- [ ] The Graph para indexación

### Fase 3: Frontend
- [ ] Dashboard de minería
- [ ] Visualización de yields
- [ ] Comparador de protocolos

### Fase 4: Avanzado
- [ ] Estrategias de IA para optimización
- [ ] Cross-chain mining
- [ ] Gobernanza DAO

## 📞 Soporte

Para preguntas o issues:
- Revisar documentación
- Abrir issue en GitHub
- Testear en Sepolia primero

---

**Última actualización**: Enero 2026  
**Versión**: 1.0.0  
**Estado**: Listo para testnet
