// Crypto Suite Backend Server
// Express server with monitoring, alerts, and API endpoints

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import middleware and services
const {
  generalLimiter,
  authLimiter,
  transactionLimiter,
  webhookLimiter,
  checkBlockedIP,
  suspiciousActivityTracker
} = require('./middleware/rateLimiter');
const { getMonitor } = require('./services/transactionMonitor');
const { getAlertService } = require('./services/alertService');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO for real-time updates
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Security middleware
app.use(checkBlockedIP);
app.use(generalLimiter);

// Initialize services
const monitor = getMonitor();
const alertService = getAlertService({
  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.ALERT_EMAIL_FROM,
    to: process.env.ALERT_EMAIL_TO
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatIds: process.env.TELEGRAM_CHAT_IDS?.split(',') || []
  },
  slack: {
    token: process.env.SLACK_TOKEN,
    channels: process.env.SLACK_CHANNELS?.split(',') || []
  }
});

// Connect monitor events to alert service
monitor.on('alert', (alert) => {
  alertService.sendAlert(alert);
  io.emit('alert', alert);
});

monitor.on('transaction', (tx) => {
  io.emit('transaction', tx);
});

monitor.on('newBlock', (block) => {
  io.emit('newBlock', block);
});

monitor.on('contractEvent', (event) => {
  io.emit('contractEvent', event);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes

// Monitor endpoints
app.get('/api/monitor/stats', (req, res) => {
  res.json(monitor.getStats());
});

app.post('/api/monitor/watch-address', transactionLimiter, (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }
  monitor.watchAddress(address);
  res.json({ success: true, message: `Now watching ${address}` });
});

app.post('/api/monitor/unwatch-address', (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }
  monitor.unwatchAddress(address);
  res.json({ success: true, message: `Stopped watching ${address}` });
});

app.get('/api/monitor/history/:address', (req, res) => {
  const { address } = req.params;
  const { limit } = req.query;
  const history = monitor.getTransactionHistory(address, parseInt(limit) || 50);
  res.json(history);
});

app.get('/api/monitor/pending', (req, res) => {
  res.json(monitor.getPendingTransactions());
});

// Alert endpoints
app.get('/api/alerts/stats', (req, res) => {
  res.json(alertService.getStats());
});

app.get('/api/alerts/history', (req, res) => {
  const { severity, type, since, limit } = req.query;
  const history = alertService.getAlertHistory({
    severity,
    type,
    since: since ? parseInt(since) : undefined,
    limit: limit ? parseInt(limit) : 50
  });
  res.json(history);
});

app.post('/api/alerts/test', authLimiter, async (req, res) => {
  const { type, message, severity } = req.body;
  try {
    const alertId = await alertService.sendAlert({
      type: type || 'TEST_ALERT',
      message: message || 'This is a test alert',
      severity: severity || 'low',
      data: { test: true }
    });
    res.json({ success: true, alertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook management
app.post('/api/webhooks', authLimiter, (req, res) => {
  const { url, events, secret } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Webhook URL is required' });
  }
  const id = `webhook_${Date.now()}`;
  alertService.registerWebhook(id, url, { events, secret });
  res.json({ success: true, id });
});

app.delete('/api/webhooks/:id', (req, res) => {
  const { id } = req.params;
  const removed = alertService.removeWebhook(id);
  res.json({ success: removed });
});

// Chain management
app.post('/api/chains', authLimiter, async (req, res) => {
  const { chainId, rpcUrl } = req.body;
  if (!chainId || !rpcUrl) {
    return res.status(400).json({ error: 'chainId and rpcUrl are required' });
  }
  const success = await monitor.addChain(chainId, rpcUrl);
  res.json({ success });
});

// Contract watching
app.post('/api/contracts/watch', transactionLimiter, async (req, res) => {
  const { chainId, address, abi, events } = req.body;
  if (!chainId || !address || !abi) {
    return res.status(400).json({ error: 'chainId, address, and abi are required' });
  }
  try {
    await monitor.watchContract(chainId, address, abi, events || []);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contracts/unwatch', (req, res) => {
  const { chainId, address } = req.body;
  if (!chainId || !address) {
    return res.status(400).json({ error: 'chainId and address are required' });
  }
  monitor.unwatchContract(chainId, address);
  res.json({ success: true });
});

// Threshold configuration
app.post('/api/config/thresholds', authLimiter, (req, res) => {
  const { type, value } = req.body;
  if (!type || value === undefined) {
    return res.status(400).json({ error: 'type and value are required' });
  }
  monitor.setAlertThreshold(type, value);
  res.json({ success: true });
});

app.post('/api/config/channel-thresholds', authLimiter, (req, res) => {
  const { channel, severity } = req.body;
  if (!channel || !severity) {
    return res.status(400).json({ error: 'channel and severity are required' });
  }
  alertService.setChannelThreshold(channel, severity);
  res.json({ success: true });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', (data) => {
    if (data.address) {
      monitor.watchAddress(data.address);
      socket.join(`address:${data.address.toLowerCase()}`);
    }
  });

  socket.on('unsubscribe', (data) => {
    if (data.address) {
      socket.leave(`address:${data.address.toLowerCase()}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Track suspicious activity
  if (err.status === 400 || err.status === 401) {
    suspiciousActivityTracker(req, res, () => {});
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize chains on startup
const initializeChains = async () => {
  const chains = [
    { id: 1, rpc: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com' },
    { id: 137, rpc: process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com' },
    { id: 42161, rpc: process.env.ARBITRUM_RPC_URL || 'https://arbitrum.llamarpc.com' },
    { id: 10, rpc: process.env.OPTIMISM_RPC_URL || 'https://optimism.llamarpc.com' },
    { id: 8453, rpc: process.env.BASE_RPC_URL || 'https://base.llamarpc.com' }
  ];

  for (const chain of chains) {
    try {
      await monitor.addChain(chain.id, chain.rpc);
    } catch (error) {
      console.error(`Failed to initialize chain ${chain.id}:`, error.message);
    }
  }
};

// Start server
const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, async () => {
  console.log(`\n🚀 Crypto Suite Backend running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
  
  await initializeChains();
  console.log('\n✅ Blockchain monitors initialized');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await monitor.disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, io, monitor, alertService };
