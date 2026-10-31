# Cómo publicar esta versión

**Rama de publicación:** `merge/asuite-y-defi`
**Estado verificado:** 24 contratos compilan · 208 tests pasan / 0 fallan · `frontend/dist` se genera

---

## Por qué no se mergea a `master`

`master` y esta rama **no comparten historia**: git responde
`fatal: refusing to merge unrelated histories`. No divergieron, son dos
historias independientes (la de enero con la línea DeFi, y la de septiembre con
la A-Suite).

Por eso **`master` se deja intacto** y se publica desde esta rama. El contenido
de las dos líneas está aquí dentro; lo único que no se puede es unificar el
historial de forma limpia.

---

## Pasos en Vercel

1. **Settings → Git → Production Branch** → `merge/asuite-y-defi`
2. **Deployments → Redeploy** (o esperar al deploy automático del push)
3. En el log del build debe verse:
   - `cd frontend && npm install --no-audit --no-fund`
   - `cd frontend && npm run build`
   - output directory: `frontend/dist`
4. Abrir `/exchange` → deben aparecer las 10 monedas.

> Si el build falla con "no build script", es que Vercel está ignorando
> `vercel.json`. En ese caso: **Settings → Build & Development → Root Directory
> = `frontend`**, Build Command = `npm run build`, Output = `dist`.

---

## Comprobar antes y después de publicar

```bash
npx hardhat test                      # 208 pasando
cd frontend && npm run build          # exit 0
python scripts/verificar-imagenes.py  # las 30 imágenes intactas
```

El verificador compara contra `INVENTARIO-IMAGENES.txt` (tamaño + hash). Si
alguna imagen se pierde, la nombra. Es la red de seguridad tras el historial de
imágenes que desaparecían.

---

## Lo que se ve en la dapp

- **16 páginas**: las 11 de la línea DeFi (Staking, Farming, Préstamos,
  Subastas, Gobernanza, Escrow, MultiSig, Analytics, Perfil…) más las 5 de la
  suite de monedas (Exchange, Token Specs, Galería, Token, Faucet).
- En `/exchange`, el panel **"Estado en cadena"** muestra el supply real y tu
  saldo por token. Mientras no haya contratos desplegados dirá
  *"no desplegado en esta red"* — no inventa datos.
- Los **precios del mercado son simulados** y así está declarado en la página.

---

## Poner las monedas de verdad en la cadena

```bash
# Local, gratis y persistente
npx hardhat node
npx hardhat run scripts/deploy-asuite.cjs --network localhost

# Sepolia (necesita PRIVATE_KEY y SEPOLIA_RPC_URL con fondos en el .env)
npm run deploy:asuite
```

El script despliega los 10 tokens y escribe las direcciones en
`frontend/src/data/asuite-addresses.json`; el panel las lee solo, sin variables
de entorno.

> No usar `--network hardhat` para nada que quieras conservar: esa red es
> efímera y las direcciones mueren al terminar el script. El propio script
> avisa si la detecta.

---

## Qué falta, dicho claro

| Pendiente | Detalle |
|---|---|
| EIP-3009 en los tokens de pago | No implementado. Sí está EIP-2612 (Permit) |
| ERC-4626 en ARES / AXRES | No implementado. Son ERC-20 + Permit |
| Governor + Timelock en los de gobernanza | No implementado; existe `Governance.sol` sin conectar |
| `master` vs esta rama | Historias no relacionadas; no hay merge limpio posible |
| Test legacy de master | Conservado en `test/legacy/CryptoSuite.test.js.bak`; prueba versiones antiguas de los contratos |
