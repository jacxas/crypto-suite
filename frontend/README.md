# Crypto Suite Frontend

Frontend Web3 para interactuar con los contratos inteligentes de Crypto Suite.

## 🚀 Tecnologías

- **React 18** - Framework UI
- **Vite** - Build tool
- **Wagmi v2** - React Hooks para Ethereum
- **RainbowKit** - Wallet connection UI
- **TailwindCSS** - Styling
- **React Router** - Routing

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus configuraciones
# VITE_WALLETCONNECT_PROJECT_ID=tu_project_id
```

## 💻 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 🔗 Configuración

### 1. WalletConnect Project ID

Obtén un Project ID gratis en [WalletConnect Cloud](https://cloud.walletconnect.com)

### 2. Direcciones de Contratos

Después de desplegar los contratos, actualiza las direcciones en:
- `.env` para desarrollo
- `src/config/wagmi.js` para configuración por red

```env
VITE_TOKEN_ADDRESS=0x...
VITE_NFT_ADDRESS=0x...
VITE_MARKETPLACE_ADDRESS=0x...
```

### 3. Redes Soportadas

- **Hardhat Localhost** (31337) - Desarrollo local
- **Sepolia** (11155111) - Testnet
- **Ethereum Mainnet** (1) - Producción
- **Polygon** (137) - Producción

## 📚 Estructura

```
frontend/
├── src/
│   ├── components/      # Componentes reutilizables
│   │   └── Layout.jsx
│   ├── pages/           # Páginas de la app
│   │   ├── Dashboard.jsx
│   │   ├── Token.jsx
│   │   ├── NFTCollection.jsx
│   │   └── Marketplace.jsx
│   ├── config/          # Configuración Web3
│   │   └── wagmi.js
│   ├── contracts/       # ABIs de contratos
│   │   ├── AdvancedTokenABI.js
│   │   ├── NFTCollectionABI.js
│   │   └── NFTMarketplaceABI.js
│   ├── styles/          # Estilos globales
│   │   └── index.css
│   ├── App.jsx          # Router principal
│   └── main.jsx         # Entry point
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## ✨ Funcionalidades

### Dashboard
- Ver balance de ETH y tokens
- Información de la red
- Direcciones de contratos
- Acciones rápidas

### Token (ERC20)
- Ver balance de tokens
- Transferir tokens
- Ver total supply
- Historial de transacciones

### NFT Collection
- Mintear nuevos NFTs
- Ver tus NFTs
- Información de la colección
- Precio de mint

### Marketplace
- Listar NFTs para venta
- Comprar NFTs
- Ver listings activos
- Estadísticas del marketplace

## 🔐 Seguridad

- Nunca compartas tu `PRIVATE_KEY`
- Usa `.env.local` para variables sensibles
- Verifica las direcciones de contratos antes de interactuar
- Prueba en testnet antes de mainnet

## 🐛 Troubleshooting

### Error: "Chain not configured"
- Asegúrate de que la red esté configurada en `wagmi.js`
- Verifica que tu wallet esté en la red correcta

### Error: "Contract not deployed"
- Verifica que los contratos estén desplegados
- Actualiza las direcciones en `.env`

### Wallet no se conecta
- Verifica tu `VITE_WALLETCONNECT_PROJECT_ID`
- Limpia cache del navegador
- Prueba con otra wallet

## 📝 Licencia

MIT
