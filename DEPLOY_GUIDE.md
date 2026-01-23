# 🚀 Guía de Despliegue - Crypto Suite

## Requisitos Previos

1. **Node.js** v18+ instalado
2. **MetaMask** u otra wallet con ETH de Sepolia
3. **ETH de Sepolia** (gratis desde faucets)

---

## Paso 1: Obtener ETH de Sepolia (Gratis)

Visita uno de estos faucets para obtener ETH de prueba:

| Faucet | URL | Cantidad |
|--------|-----|----------|
| **Alchemy** | https://sepoliafaucet.com | 0.5 ETH/día |
| **Infura** | https://www.infura.io/faucet/sepolia | 0.5 ETH/día |
| **QuickNode** | https://faucet.quicknode.com/ethereum/sepolia | 0.1 ETH |
| **Google Cloud** | https://cloud.google.com/application/web3/faucet/ethereum/sepolia | 0.05 ETH |

---

## Paso 2: Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Edita `.env` con tus valores:
```env
# Tu clave privada (sin 0x)
PRIVATE_KEY=abc123...

# RPC URL (puedes usar el público o uno de Alchemy/Infura)
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# API Key de Etherscan (opcional, para verificar contratos)
ETHERSCAN_API_KEY=tu_api_key
```

### ¿Cómo obtener tu clave privada?

**MetaMask:**
1. Abre MetaMask
2. Click en los 3 puntos (...) junto a tu cuenta
3. "Account details" > "Show private key"
4. Ingresa tu contraseña
5. Copia la clave (sin el 0x)

⚠️ **IMPORTANTE:** Nunca compartas tu clave privada ni la subas a Git.

---

## Paso 3: Instalar Dependencias

```bash
cd crypto-suite
npm install
```

---

## Paso 4: Compilar Contratos

```bash
npm run compile
```

---

## Paso 5: Desplegar en Sepolia

```bash
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

---

## Paso 6: Obtener Tokens de Prueba

Después del despliegue, el script te dará las direcciones de los contratos.
Puedes interactuar con ellos desde la dApp en https://crypto-suite-vert.vercel.app

---

## Faucets de ETH Sepolia

1. **Alchemy Faucet** (Recomendado): https://sepoliafaucet.com
2. **Google Cloud Faucet**: https://cloud.google.com/application/web3/faucet/ethereum/sepolia
3. **Infura Faucet**: https://www.infura.io/faucet/sepolia

---

## Comandos Útiles

```bash
# Compilar contratos
npm run compile

# Iniciar nodo local
npx hardhat node

# Desplegar en localhost
npx hardhat run scripts/deploy-sepolia.js --network localhost

# Desplegar en Sepolia
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```
