# Crypto Suite

Suite completa de contratos inteligentes para criptomonedas y NFTs en Ethereum.

## 📚 Contenido

- **AdvancedToken**: Token ERC20 avanzado con funcionalidades de burn, pause y permisos
- **NFTCollection**: Colección de NFTs ERC721 con minting y metadata
- **NFTMarketplace**: Marketplace para comprar y vender NFTs con ETH o tokens ERC20

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js v16 o superior
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd crypto-suite

# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env
# Editar .env con tus claves
```

### Configuración

Edita el archivo `.env` con tus configuraciones:

```env
SEPOLIA_RPC_URL=tu_url_rpc
PRIVATE_KEY=tu_clave_privada
ETHERSCAN_API_KEY=tu_api_key
```

## 🛠️ Desarrollo

### Compilar Contratos

```bash
npm run compile
```

### Ejecutar Tests

```bash
npm test
```

### Ejecutar Nodo Local

```bash
npm run node
```

### Deploy

```bash
# Localhost
npm run deploy:localhost

# Sepolia Testnet
npm run deploy:sepolia

# Mainnet
npm run deploy:mainnet

# Polygon
npm run deploy:polygon
```

## 📝 Estructura del Proyecto

```
crypto-suite/
├── contracts/          # Contratos Solidity
│   ├── AdvancedToken.sol
│   ├── NFTCollection.sol
│   └── NFTMarketplace.sol
├── scripts/           # Scripts de deployment
│   └── deploy.js
├── test/              # Tests
│   └── CryptoSuite.test.js
├── assets/            # Assets (metadata NFT)
│   └── metadata/
├── hardhat.config.js  # Configuración Hardhat
├── package.json
└── README.md
```

## 📜 Contratos

### AdvancedToken (ERC20)

Token ERC20 con funcionalidades avanzadas:

- ✅ Minteo inicial
- ✅ Burn (quemar tokens)
- ✅ Pause/Unpause
- ✅ Control de acceso

```solidity
// Ejemplo de uso
const token = await AdvancedToken.deploy("My Token", "MTK", ethers.utils.parseEther("1000000"));
```

### NFTCollection (ERC721)

Colección de NFTs con:

- ✅ Minting público con precio
- ✅ Max supply configurable
- ✅ Base URI para metadata
- ✅ Withdraw de fondos

```solidity
// Ejemplo de uso
const nft = await NFTCollection.deploy(
  "My NFT",
  "MNFT",
  "https://api.example.com/metadata/",
  ethers.utils.parseEther("0.01"),
  100
);
```

### NFTMarketplace

Marketplace completo con:

- ✅ Listado de NFTs para venta
- ✅ Compra con ETH o tokens ERC20
- ✅ Fees configurables
- ✅ Cancelación de listings
- ✅ Actualización de precios

```solidity
// Ejemplo de uso
const marketplace = await NFTMarketplace.deploy();
```

## 🧪 Testing

Los tests cubren:

- ✅ Deployment de contratos
- ✅ Funcionalidades de tokens
- ✅ Minting de NFTs
- ✅ Operaciones de marketplace
- ✅ Manejo de fees
- ✅ Casos edge

```bash
npm test
```

## 🔒 Seguridad

- Usa OpenZeppelin para contratos base
- ReentrancyGuard en funciones críticas
- Pausable para emergencias
- Access control con Ownable

## 📊 Gas Optimization

Los contratos están optimizados para:

- Minimizar operaciones de storage
- Usar eventos para datos off-chain
- Batch operations donde sea posible

## 📦 Build

Para crear un build completo:

```bash
node build.js
```

Esto:
1. Limpia artifacts anteriores
2. Compila contratos
3. Ejecuta tests
4. Copia ABIs a ./build/

## 📄 Licencia

MIT

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Para preguntas y soporte, abre un issue en GitHub.
