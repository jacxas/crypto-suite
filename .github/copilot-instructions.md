# Crypto Suite AI Coding Guidelines

## Architecture Overview

Monolithic Node.js app in `crypto-suite-complete.js` integrating blockchain (ERC-20/721/marketplace), REST API, web frontend, and AI agent. Uses ethers.js (v6 backend, v5 frontend), Express, MongoDB (optional), inline HTML/JS.

- **Smart Contracts**: AdvancedToken (staking with rewards), NFTCollection, NFTMarketplace
- **Backend**: JWT auth via MetaMask, rate-limited APIs, Prometheus metrics, Winston logs
- **Frontend**: Web3 UI with MetaMask, direct ethers calls, inline HTML served from backend
- **AI**: GPT-4 for chat, analysis, auto-compounding decisions with structured JSON prompts
- **Deployment**: Docker + MongoDB, automated deploy scripts that handle env setup and contract deployment

## Key Workflows

- **Compile Contracts**: `npm run compile` (Hardhat)
- **Deploy Contracts**: `npm run deploy` deploys to RPC network, updates `.env` with addresses
- **Local Dev**: `npm run dev` (Node --watch)
- **Production**: `docker compose up`
- **Auto Deploy**: `./deploy.sh` or `.\deploy.ps1` sets up env, installs deps, deploys contracts, starts Docker
- **AI Automation**: Hourly auto-compounding if `ADMIN_PRIVATE_KEY` set, using AI decision-making

## Project Conventions

- **Single File**: All code in `crypto-suite-complete.js`; no modules - everything (backend, frontend, contracts deployment) in one file
- **Config**: `dotenv` for env vars; deploy scripts create `.env` from template
- **Error Handling**: Async try-catch, Winston to `logs/` directory
- **Auth**: Nonce-based JWT; `ethers.verifyMessage()` for signature verification
- **Blockchain**: `JsonRpcProvider` read-only for queries, `Wallet` for transactions
- **Frontend**: Vanilla JS, DOM manipulation, ethers v5 CDN, modal-based NFT gallery
- **AI**: Structured GPT-4 prompts with JSON response parsing, system/user message format
- **Database**: MongoDB optional with graceful fallback to standalone mode

## Integration Patterns

- **MetaMask**: `window.ethereum` connect, sign messages for auth and transactions
- **Contracts**: ABI arrays defined inline + env addresses for contract instances
- **DB**: Mongoose models initialized conditionally, User/Transaction schemas
- **Metrics**: `/metrics` Prometheus histograms with http_request_duration
- **AI Endpoints**: `/api/ai/chat`, `/api/ai/analyze` with OpenAI completion calls
- **NFT Metadata**: `assets/metadata/*.json` for gallery, served via `/api/metadata/:id`
- **Gallery**: Frontend loads token metadata from `/api/gallery`, displays in grid with modal details

## Examples

- Deploy: `const token = await tokenFactory.deploy("AdvancedToken", "ADV", ethers.parseEther("1000000"));`
- API: `app.post('/api/auth/verify', async (req, res) => { const signer = ethers.verifyMessage(message, signature); ... });`
- Frontend: `const tx = await token.transfer(to, ethers.utils.parseEther(amount)); await tx.wait();`
- AI: `const completion = await openai.chat.completions.create({ model: 'gpt-4', messages: [...] });`
- Gallery: `fetch('/api/gallery').then(r => r.json()).then(d => d.tokens.forEach(t => createCard(t)));`

## Key Files

- `crypto-suite-complete.js`: Entire app - backend API, frontend HTML/JS, contract deployment, AI logic
- `contracts/*.sol`: Smart contracts (AdvancedToken with staking, NFTCollection, NFTMarketplace)
- `package.json`: Scripts, ES modules, Hardhat + OpenZeppelin deps
- `docker-compose.yml`: Services with backend + MongoDB
- `.env`: Environment vars created by deploy scripts
- `assets/metadata/*.json`: NFT metadata files for gallery
- `logs/`: Winston log files (combined.log, error.log)
