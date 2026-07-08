# GitHub Actions — Secrets necesarios

Configurá estos secrets en **Settings → Secrets and variables → Actions** de tu repo.

## Secrets requeridos

| Secret | Descripción | Usado en |
|--------|-------------|----------|
| `SEPOLIA_RPC_URL` | URL de Alchemy/Infura para Sepolia | `deploy-sepolia.yml` |
| `DEPLOYER_PRIVATE_KEY` | Clave privada del wallet deployer (sin `0x`) | `deploy-sepolia.yml` |
| `ETHERSCAN_API_KEY` | API key de Etherscan para verificar contratos | `deploy-sepolia.yml`, `contracts-ci.yml` |
| `VITE_WALLETCONNECT_PROJECT_ID` | Project ID de WalletConnect Cloud | `frontend-ci.yml` |

## Secrets opcionales

| Secret | Descripción | Usado en |
|--------|-------------|----------|
| `VITE_SEPOLIA_RPC_URL` | RPC para el frontend (puede ser público) | `frontend-ci.yml` |
| `POLYGONSCAN_API_KEY` | API key de Polygonscan | futuro |

## Cómo obtenerlos

- **SEPOLIA_RPC_URL**: [Alchemy](https://alchemy.com) → Create App → Ethereum Sepolia → `https://eth-sepolia.g.alchemy.com/v2/TU_KEY`
- **DEPLOYER_PRIVATE_KEY**: MetaMask → Account details → Export private key (usá una wallet dedicada solo a deploy, nunca tu wallet principal)
- **ETHERSCAN_API_KEY**: [etherscan.io/myapikey](https://etherscan.io/myapikey)
- **VITE_WALLETCONNECT_PROJECT_ID**: [cloud.walletconnect.com](https://cloud.walletconnect.com)

## Environment "sepolia"

El workflow `deploy-sepolia.yml` usa el environment `sepolia`. Crealo en:
**Settings → Environments → New environment → `sepolia`**

Podés configurar "Required reviewers" para que el deploy requiera aprobación manual tuya antes de ejecutarse.

> ⚠️ NUNCA commitees tu `PRIVATE_KEY` directamente en ningún archivo del repo.
