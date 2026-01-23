#!/usr/bin/env node
// crypto-suite-complete.js - Node.js 22 + ES modules + todo en 1 archivo

import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import winston from 'winston';
import promClient from 'prom-client';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import OpenAI from 'openai';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Admin wallet for automated actions
const adminWallet = process.env.ADMIN_PRIVATE_KEY ? new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, new ethers.JsonRpcProvider(process.env.RPC_URL)) : null;

// ===========================
// 1. CONTRATOS INTELIGENTES
// ===========================

const AdvancedTokenABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function stake(uint256)",
  "function unstake(uint256)",
  "function stakingBalance(address) view returns (uint256)",
  "function calculateRewards(address) view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function rewardPool() view returns (uint256)",
  "function autoCompound()",
  "event Transfer(address indexed,address indexed,uint256)",
  "event Staked(address indexed,uint256)",
  "event Unstaked(address indexed,uint256)",
  "event AutoCompounded(uint256)"
];

const NFTCollectionABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function ownerOf(uint256) view returns (address)",
  "function tokenURI(uint256) view returns (string)",
  "function mintNFT(string) returns (uint256)",
  "function batchMint(string[]) returns (uint256[])"
];

const NFTMarketplaceABI = [
  "function listNFT(uint256,uint256)",
  "function buyNFT(uint256)",
  "function cancelListing(uint256)",
  "function getActiveListings() view returns (tuple[])"
];

// Bytecode placeholder for AdvancedToken
const AdvancedTokenBytecode = "0x608060405234801561001057600080fd5b50600436106100365760003560e01c806306fdde031461003b57806395d89b4114610059575b600080fd5b610043610075565b60405161005091906100a0565b60405180910390f35b610061610103565b60405161006e91906100a0565b60405180910390f35b606060038054610084906100d1565b80601f01602080910402602001604051908101604052809291908181526020018280546100b0906100d1565b80156100dd5780601f106100b2576101008083540402835291602001916100dd565b820191906000526020600020905b8154815290600101906020018083116100c057829003601f168201915b50505050509050919050565b";

// Placeholder bytecodes for NFT and Marketplace - replace with compiled bytecodes
const NFTCollectionBytecode = "0x"; // TODO: Compile NFT contract and add bytecode
const NFTMarketplaceBytecode = "0x"; // TODO: Compile Marketplace contract and add bytecode

// ===========================
// 2. DESPLIEGUE AUTOMATICO
// ===========================

async function deployContracts() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("🚀 Desplegando contratos...");

  const tokenFactory = new ethers.ContractFactory(AdvancedTokenABI, AdvancedTokenBytecode, wallet);
  const token = await tokenFactory.deploy("AdvancedToken", "ADV", ethers.parseEther("1000000"));
  await token.waitForDeployment();

  const nftFactory = new ethers.ContractFactory(NFTCollectionABI, NFTCollectionBytecode, wallet);
  const nft = await nftFactory.deploy("CryptoArt", "CAC", "https://api.example.com/nft/");
  await nft.waitForDeployment();

  const marketplaceFactory = new ethers.ContractFactory(NFTMarketplaceABI, NFTMarketplaceBytecode, wallet);
  const marketplace = await marketplaceFactory.deploy(await token.getAddress());
  await marketplace.waitForDeployment();

  const addrs = {
    token: await token.getAddress(),
    nft: await nft.getAddress(),
    marketplace: await marketplace.getAddress()
  };

  console.log("✅ Contratos desplegados:", addrs);
  return addrs;
}

// ===========================
// 3. BACKEND API
// ===========================

const app = express();
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use('/assets', express.static('assets'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', limiter);

// MongoDB connection (solo si se inicia el servidor)
let dbConnected = false;
async function connectDB() {
  if (!dbConnected) {
    // MongoDB connection (optional - works without it)
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-suite', { serverSelectionTimeoutMS: 3000 });
  console.log('✅ MongoDB connected');
} catch (err) {
  console.log('⚠️ MongoDB not available - running in standalone mode');
}
    dbConnected = true;
  }
}

const userSchema = new mongoose.Schema({
  address: { type: String, unique: true },
  nonce: Number,
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  hash: String,
  from: String,
  to: String,
  amount: String,
  type: String,
  timestamp: { type: Date, default: Date.now }
});

let User, Transaction;

function initModels() {
  User = mongoose.models.User || mongoose.model('User', userSchema);
  Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestDuration);

// ===========================
// 4. RUTAS API
// ===========================

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/api/auth/nonce', async (req, res) => {
  const { address } = req.body;
  const nonce = Math.floor(Math.random() * 1000000);
  await User.findOneAndUpdate({ address }, { nonce }, { upsert: true });
  res.json({ nonce });
});

app.post('/api/auth/verify', async (req, res) => {
  const { address, signature } = req.body;
  const user = await User.findOne({ address });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const message = `Sign this message to authenticate: ${user.nonce}`;
  const signer = ethers.verifyMessage(message, signature);
  if (signer.toLowerCase() !== address.toLowerCase()) return res.status(401).json({ error: 'Invalid signature' });

  const token = jwt.sign({ address }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  res.json({ token });
});

app.get('/api/token/balance/:address', async (req, res) => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const token = new ethers.Contract(process.env.TOKEN_ADDRESS, AdvancedTokenABI, provider);
  const balance = await token.balanceOf(req.params.address);
  res.json({ balance: ethers.formatEther(balance) });
});

app.post('/api/token/transfer', async (req, res) => {
  // Removed for security - use frontend direct calls
  res.status(405).json({ error: 'Method not allowed - use frontend' });
});

app.get('/api/nft/owner/:address', async (req, res) => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const nft = new ethers.Contract(process.env.NFT_ADDRESS, NFTCollectionABI, provider);
  const balance = await nft.balanceOf(req.params.address);
  const tokens = [];
  for (let i = 0; i < balance; i++) {
    const tokenId = await nft.tokenOfOwnerByIndex(req.params.address, i);
    const uri = await nft.tokenURI(tokenId);
    tokens.push({ tokenId: tokenId.toString(), uri });
  }
  res.json({ tokens });
});

app.post('/api/nft/mint', async (req, res) => {
  // Removed for security - use frontend direct calls
  res.status(405).json({ error: 'Method not allowed - use frontend' });
});

app.get('/api/staking/:address', async (req, res) => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const token = new ethers.Contract(process.env.TOKEN_ADDRESS, AdvancedTokenABI, provider);
  const staked = await token.stakingBalance(req.params.address);
  const rewards = await token.calculateRewards(req.params.address);
  res.json({ staked: ethers.formatEther(staked), rewards: ethers.formatEther(rewards) });
});

// Galería de tokens
app.get('/api/gallery', async (req, res) => {
  try {
    const tokens = [];
    for (let i = 1; i <= 10; i++) {
      const metadataPath = `./assets/metadata/${i}.json`;
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        tokens.push({ id: i, ...metadata });
      }
    }
    res.json({ tokens, total: tokens.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Metadata individual
app.get('/api/metadata/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const metadataPath = `./assets/metadata/${id}.json`;
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      res.json(metadata);
    } else {
      res.status(404).json({ error: 'Token not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Agent Integration
app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an AI agent integrated into a crypto suite. Help with blockchain operations, token management, and automated decisions.' },
        { role: 'user', content: message }
      ],
    });
    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/analyze', async (req, res) => {
  const { data } = req.body;
  try {
    const prompt = `Analyze this crypto data: ${JSON.stringify(data)}. Provide insights on trends, risks, and recommendations for the token suite.`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });
    res.json({ analysis: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// 5. FRONTEND INTEGRADO
// ===========================

const frontendHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Crypto Suite - Node.js 22</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body{font-family:Arial,Helvetica,sans-serif;background:#111;color:#eee;margin:0;padding:2rem}
    .container{max-width:800px;margin:auto}
    h1,h2{color:#00d395}
    button{background:#00d395;color:#fff;border:none;padding:0.75rem 1.5rem;border-radius:4px;cursor:pointer;font-size:1rem}
    input{padding:0.5rem;margin:0.5rem 0;width:100%;max-width:300px;background:#222;border:1px solid #444;color:#fff;border-radius:4px}
    .section{margin:2rem 0;padding:1rem;background:#1a1a1a;border-radius:8px}
    .hidden{display:none}
    .stat{display:inline-block;margin:1rem;padding:1rem;background:#222;border-radius:8px}
    .token-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:1rem;margin-top:1rem}
    .token-card{background:#222;border-radius:8px;overflow:hidden;text-align:center}
    .token-card img{width:100%;height:150px;object-fit:cover;cursor:pointer;transition:transform 0.3s}
    .token-card img:hover{transform:scale(1.05)}
    .token-card p{padding:0.5rem;margin:0}
    .token-card .rarity{font-size:0.8rem;color:#00d395}
    .modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:1000;justify-content:center;align-items:center}
    .modal.active{display:flex}
    .modal-content{background:#1a1a1a;padding:2rem;border-radius:12px;max-width:500px;text-align:center}
    .modal-content img{max-width:100%;border-radius:8px;margin-bottom:1rem}
    .modal-content .attributes{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;margin-top:1rem}
    .modal-content .attr{background:#222;padding:0.5rem 1rem;border-radius:4px;font-size:0.9rem}
    .close-btn{position:absolute;top:1rem;right:1rem;font-size:2rem;color:#fff;cursor:pointer}
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Crypto Suite - Node.js 22</h1>
    <p>Wallet: <span id="wallet">Not connected</span></p>
    <button id="connectBtn">Connect Wallet</button>

    <div id="app" class="hidden">
      <div class="section">
        <h2>💰 Token Balance</h2>
        <p id="balance">0 ADV</p>
        <h3>Staking Info</h3>
        <p id="stakingInfo">Staked: 0 ADV, Rewards: 0 ADV</p>
        <h3>Global Stats</h3>
        <p id="globalStats">Total Staked: 0 ADV, Reward Pool: 0 ADV</p>
      </div>

      <div class="section">
        <h2>📤 Transfer Tokens</h2>
        <input id="to" placeholder="To address" />
        <input id="amount" placeholder="Amount" />
        <button onclick="transfer()">Transfer</button>
      </div>

      <div class="section">
        <h2>🔒 Stake</h2>
        <input id="stakeAmount" placeholder="Amount to stake" />
        <button onclick="stake()">Stake</button>
        <input id="unstakeAmount" placeholder="Amount to unstake" />
        <button onclick="unstake()">Unstake</button>
      </div>

      <div class="section">
        <h2>🎨 NFTs</h2>
        <ul id="nfts"></ul>
        <input id="uri" placeholder="Token URI" />
        <button onclick="mintNFT()">Mint NFT</button>
      </div>

      <div class="section">
        <h2>🖼️ Galería de Tokens</h2>
        <div class="token-gallery" id="tokenGallery"></div>
      </div>

      <div class="section">
        <h2>🤖 AI Agent</h2>
        <div id="chat">
          <input id="chatInput" placeholder="Ask the AI agent..." />
          <button onclick="sendMessage()">Send</button>
          <div id="chatResponse"></div>
        </div>
        <button onclick="analyzeStats()">Analyze Stats</button>
        <div id="analysisResponse"></div>
      </div>

      <!-- Modal para detalles del token -->
      <div class="modal" id="tokenModal">
        <span class="close-btn" onclick="closeModal()">&times;</span>
        <div class="modal-content">
          <img id="modalImage" src="" alt="Token"/>
          <h2 id="modalName"></h2>
          <p id="modalDesc"></p>
          <div class="attributes" id="modalAttrs"></div>
          <button onclick="mintFromGallery()" style="margin-top:1rem">Mint este NFT</button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js"></script>
  <script>
    let provider, signer, address, token, nft;
    const TOKEN_ADDRESS = '${process.env.TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000'}';
    const NFT_ADDRESS = '${process.env.NFT_ADDRESS || '0x0000000000000000000000000000000000000000'}';
    
    const tokenABI = [
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address,uint256) returns (bool)",
      "function stake(uint256)",
      "function unstake(uint256)",
      "function stakingBalance(address) view returns (uint256)",
      "function calculateRewards(address) view returns (uint256)",
      "function totalStaked() view returns (uint256)",
      "function rewardPool() view returns (uint256)"
    ];
    
    const nftABI = [
      "function balanceOf(address) view returns (uint256)",
      "function tokenOfOwnerByIndex(address,uint256) view returns (uint256)",
      "function mintNFT(string) returns (uint256)"
    ];

    async function connect() {
      if (!window.ethereum) return alert("Install MetaMask");
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      address = await signer.getAddress();
      document.getElementById("wallet").innerText = address;
      document.getElementById("app").classList.remove("hidden");

      token = new ethers.Contract(TOKEN_ADDRESS, tokenABI, signer);
      nft = new ethers.Contract(NFT_ADDRESS, nftABI, signer);

      updateBalance();
      loadNFTs();
    }

    async function updateBalance() {
      try {
        const bal = await token.balanceOf(address);
        document.getElementById("balance").innerText = ethers.utils.formatEther(bal) + " ADV";
        await updateStakingInfo();
        await updateGlobalStats();
      } catch(e) { console.error(e); }
    }

    async function updateStakingInfo() {
      try {
        const staked = await token.stakingBalance(address);
        const rewards = await token.calculateRewards(address);
        document.getElementById("stakingInfo").innerText = "Staked: " + ethers.utils.formatEther(staked) + " ADV, Rewards: " + ethers.utils.formatEther(rewards) + " ADV";
      } catch(e) { console.error(e); }
    }

    async function updateGlobalStats() {
      try {
        const totalStaked = await token.totalStaked();
        const rewardPool = await token.rewardPool();
        document.getElementById("globalStats").innerText = "Total Staked: " + ethers.utils.formatEther(totalStaked) + " ADV, Reward Pool: " + ethers.utils.formatEther(rewardPool) + " ADV";
      } catch(e) { console.error(e); }
    }

    async function transfer() {
      const to = document.getElementById("to").value;
      const amt = document.getElementById("amount").value;
      const tx = await token.transfer(to, ethers.utils.parseEther(amt));
      await tx.wait();
      alert("Transfer done");
      updateBalance();
    }

    async function stake() {
      const amt = document.getElementById("stakeAmount").value;
      const tx = await token.stake(ethers.utils.parseEther(amt));
      await tx.wait();
      alert("Staked");
      updateBalance();
    }

    async function unstake() {
      const amt = document.getElementById("unstakeAmount").value;
      const tx = await token.unstake(ethers.utils.parseEther(amt));
      await tx.wait();
      alert("Unstaked");
      updateBalance();
    }

    async function mintNFT() {
      const uri = document.getElementById("uri").value;
      const tx = await nft.mintNFT(uri);
      await tx.wait();
      alert("NFT minted");
      loadNFTs();
    }

    async function loadNFTs() {
      try {
        const balance = await nft.balanceOf(address);
        const ul = document.getElementById("nfts");
        ul.innerHTML = "";
        for (let i = 0; i < balance.toNumber(); i++) {
          const id = await nft.tokenOfOwnerByIndex(address, i);
          const li = document.createElement("li");
          li.innerText = "Token ID: " + id.toString();
          ul.appendChild(li);
        }
      } catch(e) { console.error(e); }
    }

    document.getElementById("connectBtn").onclick = connect;

    // Cargar galería de tokens
    let galleryData = [];
    async function loadGallery() {
      try {
        const res = await fetch('/api/gallery');
        const data = await res.json();
        galleryData = data.tokens;
        const gallery = document.getElementById('tokenGallery');
        gallery.innerHTML = '';
        data.tokens.forEach(token => {
          const rarity = token.attributes?.find(a => a.trait_type === 'Rarity')?.value || 'Unknown';
          const card = document.createElement('div');
          card.className = 'token-card';
          card.innerHTML = "<img src='" + token.image + "' alt='" + token.name + "' onclick='showTokenDetails(" + token.id + ")'/><p>" + token.name + "</p><p class='rarity'>" + rarity + "</p>";
          gallery.appendChild(card);
        });
      } catch(e) { console.error('Error loading gallery:', e); }
    }

    let selectedTokenId = null;
    function showTokenDetails(id) {
      const token = galleryData.find(t => t.id === id);
      if (!token) return;
      selectedTokenId = id;
      document.getElementById('modalImage').src = token.image;
      document.getElementById('modalName').innerText = token.name;
      document.getElementById('modalDesc').innerText = token.description;
      const attrsDiv = document.getElementById('modalAttrs');
      attrsDiv.innerHTML = '';
      token.attributes?.forEach(attr => {
        const span = document.createElement('span');
        span.className = 'attr';
        span.innerText = attr.trait_type + ': ' + attr.value;
        attrsDiv.appendChild(span);
      });
      document.getElementById('tokenModal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('tokenModal').classList.remove('active');
    }

    async function mintFromGallery() {
      if (!selectedTokenId) return;
      const uri = '/api/metadata/' + selectedTokenId;
      try {
        const tx = await nft.mintNFT(uri);
        await tx.wait();
        alert('NFT #' + selectedTokenId + ' minteado exitosamente!');
        closeModal();
        loadNFTs();
      } catch(e) { alert('Error: ' + e.message); }
    }

    // Cargar galería al inicio
    loadGallery();

    async function sendMessage() {
      const message = document.getElementById('chatInput').value;
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
        const data = await res.json();
        document.getElementById('chatResponse').innerText = data.response;
      } catch(e) { console.error(e); }
    }

    async function analyzeStats() {
      // Gather current stats
      const balance = document.getElementById('balance').innerText;
      const stakingInfo = document.getElementById('stakingInfo').innerText;
      const globalStats = document.getElementById('globalStats').innerText;
      const data = { balance, stakingInfo, globalStats };
      try {
        const res = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data })
        });
        const result = await res.json();
        document.getElementById('analysisResponse').innerText = result.analysis;
      } catch(e) { console.error(e); }
    }
  </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(frontendHTML));

// ===========================
// 6. CLI Y AUTOMATIZACION
// ===========================

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (command === 'deploy') {
    const addrs = await deployContracts();
    console.log("\n📋 Guarda estas direcciones en tu .env:");
    console.log("TOKEN_ADDRESS=" + addrs.token);
    console.log("NFT_ADDRESS=" + addrs.nft);
    console.log("MARKETPLACE_ADDRESS=" + addrs.marketplace);
    process.exit(0);
  } else if (command === 'start') {
    // Crear directorio de logs si no existe
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
    
    await connectDB();
    initModels();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Crypto Suite (Node.js 22) with AI running at http://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/health`);
      console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
    });

    // AI-driven auto-compounding every hour
    if (adminWallet) {
      setInterval(async () => {
        try {
          // Get current stats
          const token = new ethers.Contract(process.env.TOKEN_ADDRESS, AdvancedTokenABI, adminWallet);
          const totalStaked = await token.totalStaked();
          const rewardPool = await token.rewardPool();
          const totalSupply = await token.totalSupply();

          // Ask AI to decide
          const prompt = `As an AI admin for a crypto token suite, decide if we should auto-compound rewards now. Stats: Total Staked: ${ethers.formatEther(totalStaked)}, Reward Pool: ${ethers.formatEther(rewardPool)}, Total Supply: ${ethers.formatEther(totalSupply)}. Respond with JSON: { "compound": true/false, "reason": "explanation" }`;
          const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
          });
          const decision = JSON.parse(completion.choices[0].message.content);

          if (decision.compound) {
            const tx = await token.autoCompound();
            await tx.wait();
            console.log('✅ AI decided to auto-compound:', decision.reason);
          } else {
            console.log('⏸️ AI decided not to compound:', decision.reason);
          }
        } catch (e) {
          console.error('AI auto-compound failed:', e.message);
        }
      }, 60 * 60 * 1000); // 1 hour
    }
  } else {
    console.log(`
🔧 Crypto Suite - Node.js 22 with AI Integration
`);
    console.log(`Uso:`);
    console.log(`  npm run deploy  -> Desplegar contratos`);
    console.log(`  npm start       -> Iniciar backend + frontend con AI agent`);
    console.log(`  npm run dev     -> Modo desarrollo con hot reload
`);
  }
}

main().catch(console.error);
