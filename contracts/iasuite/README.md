# IA-Suite — contratos

Copia de trabajo de los contratos de la **IA-Suite** (10 tokens de inteligencia
artificial + hub + seguridad), traídos de la variante v2 de
`develop-ia-token-suite` (`C:\Users\JACXAS\Desktop\webs crypto\web crypto 1\ia-suite`).

## Qué hay

| Contrato | Papel |
|---|---|
| `AITH.sol` … `AIFA.sol` | Los 10 tokens ERC-20, cada uno con su utilidad (gobernanza, cómputo, datos, seguridad, agentes, recompensas, creadores, gas, exchange, farming). |
| `IAHub.sol` | Hub de coordinación: autoriza emisiones y quemas de la suite. |
| `security/IATimelock.sol` | Retardo de ejecución para cambios críticos. |
| `security/IATreasury.sol` | Tesorería con reglas de salida. |

Los tokens son **autosuficientes**: heredan directamente de OpenZeppelin
(`ERC20`, `Ownable`), no de una clase base propia. La variante v1 sí tenía
`AIBase`/`AIBaseV2`; si algún día se quiere esa abstracción, está en
`C:\Users\JACXAS\Desktop\webs crypto\web crypto\ia-suite\contracts`.

## Estado

- **No compilados ni desplegados en este repositorio.** No hay `artifacts/`,
  ni `hardhat.config`, ni direcciones.
- El proyecto original trae `hardhat.config.cjs`, `scripts/deploy.js`,
  `deploy_all.js`, `verify_all.js` y `audit_security.js`; se pueden portar
  cuando se decida desplegar.
- La interfaz (`/ia-suite`) es un escaparate: muestra fichas y funciones, y
  dice expresamente que no hay direcciones.

## Siguiente paso, si se decide desplegar

1. Traer `hardhat.config` y los scripts de despliegue de la variante original.
2. Compilar (`npx hardhat compile`) y corregir lo que salga.
3. Desplegar en testnet con una clave propia (nunca compartida por chat).
4. Escribir las direcciones en `frontend/src/data/ia-addresses.json` y leerlas
   desde la página, igual que hace la A-Suite con `asuite-addresses.json`.
