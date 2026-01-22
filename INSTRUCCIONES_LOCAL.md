# 🚀 Guía de Inicio Rápido (Entorno Local)

He configurado tu proyecto para funcionar con una blockchain local (Hardhat), pero la instalación automática de dependencias tomó más tiempo del esperado.

Sigue estos pasos para finalizar:

## 1. Instalar Dependencias
Si no se ha completado, ejecuta:
```bash
npm install
```

## 2. Iniciar Blockchain Local
Abre una **nueva terminal** y ejecuta:
```bash
npx hardhat node
```
*Déjala abierta.* Verás cuentas y claves privadas (ya configuradas en tu `.env`).

## 3. Desplegar Contratos
En tu terminal principal, ejecuta:
```bash
npm run deploy
```

## 4. Iniciar Aplicación
Finalmente, levanta todo (Backend + Base de Datos):
```powershell
.\deploy.ps1
```
o manualmente con Docker:
```bash
docker compose up --build
```

¡Listo! Tu app estará en http://localhost:3000
