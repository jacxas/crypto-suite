# deploy.ps1 -> Automatiza despliegue completo (Node.js 22 + Docker + Contratos)
# Para Windows PowerShell

$ErrorActionPreference = "Stop"

# 1. Verificar Node.js 22
Write-Host "🔍 Verificando Node.js 22..." -ForegroundColor Yellow
$nodeVersion = node -v
if ($nodeVersion -notmatch "v2[2-9]") {
    Write-Host "❌ Node.js 22+ es requerido" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js $nodeVersion detectado" -ForegroundColor Green

# 2. Crear .env si no existe
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creando .env..." -ForegroundColor Yellow
    @"
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
NFT_ADDRESS=0x0000000000000000000000000000000000000000
MARKETPLACE_ADDRESS=0x0000000000000000000000000000000000000000
JWT_SECRET=supersecretjwtkey
MONGODB_URI=mongodb://mongo:27017/crypto-suite
PORT=3000PAYMENT_ETH_ADDRESS=0xC64d605FcB3F43E83C11a5e99c275E6A460810F4
PAYMENT_BTC_ADDRESS=bc1qumuen7c7zsyrxnrqcwv07p7us46ju8d6k0awqk"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env creado. Editalo antes de continuar." -ForegroundColor Green
    exit 0
}

# 3. Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm install

# 4. Detectar si contratos estan desplegados
$envContent = Get-Content ".env" -Raw
if ($envContent -match "TOKEN_ADDRESS=0x0{40}") {
    Write-Host "🚀 Desplegando contratos..." -ForegroundColor Yellow
    npm run deploy 2>&1 | Tee-Object -FilePath "deploy.log"
    Write-Host "✅ Contratos desplegados" -ForegroundColor Green
} else {
    Write-Host "✅ Contratos ya desplegados (detectados en .env)" -ForegroundColor Green
}

# 5. Construir y levantar con Docker
Write-Host "🐳 Construyendo y levantando con Docker..." -ForegroundColor Yellow
docker compose down --volumes --remove-orphans 2>$null
docker compose build --no-cache
docker compose up -d

# 6. Esperar a que el servicio este listo
Write-Host "⏳ Esperando a que el servicio este listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 7. Mostrar estado y URLs
Write-Host ""
Write-Host "🎉 Despliegue completo!" -ForegroundColor Green
Write-Host "🌐 Abre en tu navegador:" -ForegroundColor Green
Write-Host "   -> http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Metricas:" -ForegroundColor Yellow
Write-Host "   -> http://localhost:3000/metrics" -ForegroundColor Yellow
Write-Host ""
Write-Host "🧪 Logs en tiempo real:" -ForegroundColor Yellow
Write-Host "   -> docker logs -f crypto-suite-backend" -ForegroundColor Yellow
Write-Host ""

# 8. Abrir navegador
Start-Process "http://localhost:3000"
