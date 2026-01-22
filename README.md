# 🧠 Crypto Suite - Blockchain Development Platform with AI Integration

[![Node.js](https://img.shields.io/badge/Node.js-22+-green)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**Crypto Suite** es una plataforma blockchain completa con integración de IA que permite crear, desplegar y gestionar tokens ERC-20, NFTs ERC-721, staking, farming y un marketplace descentralizado — todo en un único archivo con Node.js 22 y Docker. Incluye un agente AI automatizado para asistencia y decisiones inteligentes, con mecanismos de auto-escalabilidad y sustentabilidad a través de fees y compounding automático.

---

## 🚀 Características

| Módulo | Descripción |
| -------- | ------------- |
| 🔗 **Contratos inteligentes** | ERC-20, ERC-721, Staking, Farming, Marketplace, MultiContract |
| 🤖 **AI Agent** | Agente automatizado con OpenAI para chat, decisiones y análisis inteligente |
| 🔄 **Auto-escalable** | Fees en transferencias alimentan el pool de recompensas, compounding automático |
| 🧪 **Testing** | Scripts de prueba automatizados con Hardhat |
| 🖥️ **Backend** | API REST con Express, MongoDB, autenticación JWT |
| 🎨 **Frontend** | UI web3 integrada con MetaMask |
| 🐳 **Docker** | Contenedorizado con `docker-compose up` |
| 📊 **Monitoreo** | Métricas con Prometheus y logs con Winston |
| ⚙️ **CLI** | Comandos para desplegar, iniciar y desarrollar |

---

## 🤖 AI Integration

La suite incluye un agente AI automatizado basado en OpenAI GPT-4 para:

- **Chat interactivo**: Responde preguntas sobre blockchain y operaciones.
- **Decisiones automatizadas**: Sugerencias para staking, trading, y compounding basado en IA.
- **Análisis inteligente**: Evalúa estadísticas del token y proporciona insights.
- **Admin automatizado**: El admin wallet usa IA para decidir cuándo compoundar recompensas.

Configura `OPENAI_API_KEY` y `ADMIN_PRIVATE_KEY` en tu `.env` para activar.

---

## 📦 Instalación rápida

### Requisitos

- [Node.js 22+](https://nodejs.org/)
- [Docker](https://docker.com/)
- [MetaMask](https://metamask.io/)

### 1. Clona el repositorio

```bash
git clone https://github.com/your-org/crypto-suite.git
cd crypto-suite
```

### 2. Configura tu entorno

**Linux/macOS:**

```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows PowerShell:**

```powershell
.\deploy.ps1
```

Esto creará `.env`, instalará dependencias, desplegará contratos y levantará Docker.

---

## 🧪 Uso local (sin Docker)

```bash
npm install
npm run deploy   # Despliega contratos
npm start        # Inicia backend + frontend
npm run dev      # Modo desarrollo con hot reload
```

Abre → [http://localhost:3000](http://localhost:3000)

---

## 🐳 Uso con Docker

```bash
docker compose up --build
```

Abre → [http://localhost:3000](http://localhost:3000)

---

## 📁 Estructura del proyecto

```text
crypto-suite/
├── crypto-suite-complete.js   # Todo el proyecto en 1 archivo
├── deploy.sh                  # Script de despliegue automático (Linux/macOS)
├── deploy.ps1                 # Script de despliegue automático (Windows)
├── Dockerfile                 # Imagen Docker (Node.js 22)
├── docker-compose.yml         # Servicios: backend + MongoDB
├── package.json               # Dependencias y scripts
├── .env                       # Variables de entorno (crear desde .env.example)
├── README.md                  # Este archivo
└── logs/                      # Logs generados automáticamente
```

---

## 📝 Contratos Disponibles

### MultiContract.sol

Contrato multi-propósito que incluye:

- **Staking de Tokens**: Stake tokens ERC-20 y gana recompensas automáticas
- **Escrow de NFTs**: Sistema de custodia segura para trading de NFTs
- **Time Locks**: Transacciones bloqueadas por tiempo
- **Multi-Signature**: Operaciones que requieren múltiples confirmaciones

**Características principales:**
- Tasa de recompensa configurable (default: 1% diario)
- Protección contra reentrancy
- Sistema pausable para emergencias
- Múltiples signatarios configurables
- Escrow con deadlines automáticos

**Funciones principales:**
- `stake(amount)`: Depositar tokens para staking
- `unstake(amount)`: Retirar tokens stakeados
- `claimRewards()`: Reclamar recompensas acumuladas
- `createEscrow(nftContract, tokenId, price, duration)`: Crear escrow de NFT
- `completeEscrow(escrowId)`: Completar compra de NFT en escrow
- `createTimeLock(recipient, releaseTime)`: Crear transacción con time lock
- `submitMultiSigTx(to, value, data)`: Enviar transacción multi-sig

---

## 🔗 API Endpoints

### Autenticación

| Método | Ruta                  | Descripción              |
| -------- | ----------------------- | -------------------------- |
| POST   | `/api/auth/nonce`     | Obtener nonce para firmar |
| POST   | `/api/auth/verify`    | Verificar firma y obtener JWT |

### Tokens

| Método | Ruta                      | Descripción       |
|--------|---------------------------|-------------------|
| GET    | `/api/token/balance/:address` | Balance de ERC-20 |
| POST   | `/api/token/transfer`     | Transferir tokens |

### NFTs

| Método | Ruta                  | Descripción       |
|--------|-----------------------|-------------------|
| GET    | `/api/nft/owner/:address` | NFTs de un usuario |
| POST   | `/api/nft/mint`       | Mintear nuevo NFT |

### Staking

| Método | Ruta                  | Descripción          |
|--------|-----------------------|----------------------|
| GET    | `/api/staking/:address` | Balance y recompensas |

### Salud y métricas

| Método | Ruta      | Descripción          |
|--------|-----------|----------------------|
| GET    | `/health` | Estado del servicio  |
| GET    | `/metrics`| Métricas de Prometheus |

---

## 🧰 Scripts

| Comando | Descripción |
| --------- | ------------- |
| `npm run deploy` | Despliega contratos a la red configurada |
| `npm start` | Inicia backend + frontend |
| `npm run dev` | Modo desarrollo con hot reload |
| `./deploy.sh` | Automatiza todo (contratos + Docker + env) - Linux/macOS |
| `.\deploy.ps1` | Automatiza todo (contratos + Docker + env) - Windows |

---

## 🔐 Variables de entorno

Crea un `.env` desde `.env.example`:

```env
PRIVATE_KEY=0x1234...abcd
RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
TOKEN_ADDRESS=0x...
NFT_ADDRESS=0x...
MARKETPLACE_ADDRESS=0x...
JWT_SECRET=supersecretjwtkey
MONGODB_URI=mongodb://mongo:27017/crypto-suite
PORT=3000
```

---

## 🧪 Testing

```bash
npm test
```

Los tests están integrados en `crypto-suite-complete.js` y se ejecutan con Hardhat.

---

## 📊 Monitoreo

- **Logs**: `./logs/combined.log` y `./logs/error.log`
- **Métricas**: [http://localhost:3000/metrics](http://localhost:3000/metrics)
- **Salud**: [http://localhost:3000/health](http://localhost:3000/health)

---

## 🛡️ Seguridad

- Rate limiting (100 req/15min)
- Helmet para headers seguros
- JWT para autenticación
- Variables de entorno para claves

---

## 🤝 Contribuciones

1. Fork este repositorio
2. Crea tu rama (`git checkout -b feature/lo-que-sea`)
3. Commit tus cambios (`git commit -m 'Add feature'`)
4. Push a la rama (`git push origin feature/lo-que-sea`)
5. Abre un Pull Request

---

## 📄 Licencia

**MIT License** — © 2025 Crypto Suite

Puedes usar, modificar y distribuir libremente.

---

## 🎯 ¿Listo para desplegar?

**Linux/macOS:**

```bash
./deploy.sh
```

**Windows PowerShell:**

```powershell
.\deploy.ps1
```

Y listo. Todo funcionando en **1 archivo, 1 comando, 1 contenedor**.
