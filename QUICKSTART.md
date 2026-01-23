# 🚀 Guía de Inicio Rápido - Crypto Suite

## Instalación en 5 Minutos

### 1. Instalar Dependencias

```bash
cd crypto-suite
npm install
```

### 2. Configurar Entorno

```bash
cp .env.example .env
```

Edita `.env` con tus datos:

```env
PRIVATE_KEY=tu_clave_privada_aqui
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/TU_API_KEY
```

### 3. Compilar

```bash
npm run compile
```

### 4. Ejecutar Tests

```bash
npm test
```

### 5. Deploy Local

**Terminal 1** - Iniciar nodo local:
```bash
npm run node
```

**Terminal 2** - Deploy:
```bash
npm run deploy:localhost
```

## 🎯 Casos de Uso Rápidos

### Crear y Distribuir Token

```javascript
const token = await AdvancedToken.deploy(
  "Mi Token",
  "MTK",
  ethers.utils.parseEther("1000000")
);

// Transferir tokens
await token.transfer(direccion, ethers.utils.parseEther("100"));
```

### Crear Colección NFT

```javascript
const nft = await NFTCollection.deploy(
  "Mi Colección",
  "MNFT",
  "https://mi-api.com/metadata/",
  ethers.utils.parseEther("0.01"), // Precio mint
  100 // Max supply
);

// Mintear NFT
await nft.mint(1, { value: ethers.utils.parseEther("0.01") });
```

### Vender NFT en Marketplace

```javascript
// 1. Aprobar marketplace
await nft.approve(marketplace.address, tokenId);

// 2. Listar NFT
await marketplace.listNFTForETH(
  nft.address,
  tokenId,
  ethers.utils.parseEther("1") // Precio
);

// 3. Comprar NFT (desde otra cuenta)
await marketplace.buyNFTWithETH(listingId, {
  value: ethers.utils.parseEther("1")
});
```

## 🛠️ Comandos Útiles

```bash
# Limpiar artifacts
npm run clean

# Ver cobertura de tests
npm run coverage

# Deploy a Sepolia
npm run deploy:sepolia

# Deploy a Polygon
npm run deploy:polygon
```

## 🐛 Troubleshooting

### Error: "Insufficient funds"
- Asegúrate de tener ETH en tu wallet
- Para testnets, usa un faucet

### Error: "Nonce too high"
- Resetea tu cuenta en MetaMask
- O espera a que se confirmen las transacciones pendientes

### Tests fallan
- Ejecuta `npm run clean`
- Luego `npm run compile`
- Finalmente `npm test`

## 📚 Recursos

- [Hardhat Docs](https://hardhat.org/docs)
- [OpenZeppelin Docs](https://docs.openzeppelin.com/)
- [Ethers.js Docs](https://docs.ethers.org/)

## ✅ Checklist de Deployment

- [ ] Tests pasando (100%)
- [ ] Archivo .env configurado
- [ ] Fondos suficientes en wallet
- [ ] Red correcta seleccionada
- [ ] Etherscan API key configurada (para verificación)
- [ ] Backup de claves privadas

¡Listo para empezar! 🎉
