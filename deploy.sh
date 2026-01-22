#!/usr/bin/env bash
# deploy.sh → Automatiza despliegue completo (Node.js 22 + Docker + Contratos)

set -e  # Salir si hay error

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Node.js 22
echo -e "${YELLOW}🔍 Verificando Node.js 22...${NC}"
if ! node -v | grep -E "v2[2-9]\." > /dev/null; then
  echo -e "${RED}❌ Node.js 22+ es requerido${NC}"
  exit 1
fi

# 2. Crear .env si no existe
if [ ! -f .env ]; then
  echo -e "${YELLOW}📝 Creando .env desde .env.example...${NC}"
  cat > .env <<EOF
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
NFT_ADDRESS=0x0000000000000000000000000000000000000000
MARKETPLACE_ADDRESS=0x0000000000000000000000000000000000000000
JWT_SECRET=supersecretjwtkey
MONGODB_URI=mongodb://mongo:27017/crypto-suite
PORT=3000
EOF
  echo -e "${GREEN}✅ .env creado. Edítalo antes de continuar.${NC}"
  exit 0
fi

# 3. Instalar dependencias
echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
npm install

# 4. Detectar si contratos están desplegados
TOKEN_ADDRESS=$(grep TOKEN_ADDRESS .env | cut -d '=' -f2)
if [[ "$TOKEN_ADDRESS" == "0x0000000000000000000000000000000000000000" ]]; then
  echo -e "${YELLOW}🚀 Desplegando contratos...${NC}"
  npm run deploy > deploy.log 2>&1
  echo -e "${GREEN}✅ Contratos desplegados. Direcciones guardadas en .env${NC}"
else
  echo -e "${GREEN}✅ Contratos ya desplegados (detectados en .env)${NC}"
fi

# 5. Construir y levantar con Docker
echo -e "${YELLOW}🐳 Construyendo y levantando con Docker...${NC}"
docker compose down --volumes --remove-orphans 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# 6. Esperar a que el servicio esté listo
echo -e "${YELLOW}⏳ Esperando a que el servicio esté listo...${NC}"
sleep 10

# 7. Mostrar estado y URLs
echo ""
echo -e "${GREEN}🎉 ¡Despliegue completo!${NC}"
echo -e "${GREEN}🌐 Abre en tu navegador:${NC}"
echo -e "${GREEN}   → http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}📊 Métricas:${NC}"
echo -e "${YELLOW}   → http://localhost:3000/metrics${NC}"
echo ""
echo -e "${YELLOW}🧪 Logs en tiempo real:${NC}"
echo -e "${YELLOW}   → docker logs -f crypto-suite-backend${NC}"
echo ""

# 8. Guardar direcciones desplegadas (si se ejecutó deploy)
if [ -f deploy.log ]; then
  grep -E "TOKEN_ADDRESS=|NFT_ADDRESS=|MARKETPLACE_ADDRESS=" deploy.log >> .env
  rm deploy.log
fi

# 9. Opción: abrir navegador (solo macOS/Linux)
if command -v xdg-open > /dev/null; then
  xdg-open http://localhost:3000
elif command -v open > /dev/null; then
  open http://localhost:3000
fi
