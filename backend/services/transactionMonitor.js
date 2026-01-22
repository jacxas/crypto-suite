// Transaction Monitor Service for Crypto Suite
// Real-time monitoring of blockchain transactions

const { ethers } = require('ethers');
const EventEmitter = require('events');

class TransactionMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    this.providers = new Map();
    this.watchedAddresses = new Set();
    this.watchedContracts = new Map();
    this.pendingTransactions = new Map();
    this.transactionHistory = [];
    this.maxHistorySize = config.maxHistorySize || 1000;
    this.alertThresholds = {
      largeTransaction: ethers.parseEther('10'), // 10 ETH
      gasPrice: ethers.parseUnits('100', 'gwei'), // 100 gwei
      failedTxCount: 5 // Alert after 5 failed txs
    };
    this.failedTxCounts = new Map();
  }

  // Initialize provider for a chain
  async addChain(chainId, rpcUrl) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await provider.getNetwork(); // Verify connection
      this.providers.set(chainId, provider);
      this.setupBlockListener(chainId, provider);
      console.log(`Chain ${chainId} connected successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to connect to chain ${chainId}:`, error);
      return false;
    }
  }

  // Setup block listener for real-time monitoring
  setupBlockListener(chainId, provider) {
    provider.on('block', async (blockNumber) => {
      try {
        const block = await provider.getBlock(blockNumber, true);
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            await this.processTransaction(chainId, tx, blockNumber);
          }
        }
        this.emit('newBlock', { chainId, blockNumber });
      } catch (error) {
        console.error(`Error processing block ${blockNumber}:`, error);
      }
    });
  }

  // Process individual transaction
  async processTransaction(chainId, tx, blockNumber) {
    const isWatched = this.watchedAddresses.has(tx.from?.toLowerCase()) ||
                      this.watchedAddresses.has(tx.to?.toLowerCase());

    if (!isWatched) return;

    const provider = this.providers.get(chainId);
    const receipt = await provider.getTransactionReceipt(tx.hash);

    const txData = {
      hash: tx.hash,
      chainId,
      blockNumber,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      gasPrice: tx.gasPrice?.toString(),
      gasUsed: receipt?.gasUsed?.toString(),
      status: receipt?.status === 1 ? 'success' : 'failed',
      timestamp: Date.now(),
      contractAddress: receipt?.contractAddress
    };

    // Store in history
    this.transactionHistory.unshift(txData);
    if (this.transactionHistory.length > this.maxHistorySize) {
      this.transactionHistory.pop();
    }

    // Emit transaction event
    this.emit('transaction', txData);

    // Check for alerts
    await this.checkAlerts(txData);

    // Remove from pending if exists
    this.pendingTransactions.delete(tx.hash);
  }

  // Check and trigger alerts
  async checkAlerts(txData) {
    const alerts = [];

    // Large transaction alert
    if (BigInt(txData.value) >= this.alertThresholds.largeTransaction) {
      alerts.push({
        type: 'LARGE_TRANSACTION',
        severity: 'high',
        message: `Large transaction detected: ${ethers.formatEther(txData.value)} ETH`,
        data: txData
      });
    }

    // High gas price alert
    if (txData.gasPrice && BigInt(txData.gasPrice) >= this.alertThresholds.gasPrice) {
      alerts.push({
        type: 'HIGH_GAS_PRICE',
        severity: 'medium',
        message: `High gas price: ${ethers.formatUnits(txData.gasPrice, 'gwei')} gwei`,
        data: txData
      });
    }

    // Failed transaction tracking
    if (txData.status === 'failed') {
      const key = txData.from.toLowerCase();
      const count = (this.failedTxCounts.get(key) || 0) + 1;
      this.failedTxCounts.set(key, count);

      if (count >= this.alertThresholds.failedTxCount) {
        alerts.push({
          type: 'MULTIPLE_FAILED_TX',
          severity: 'high',
          message: `${count} failed transactions from ${txData.from}`,
          data: { address: txData.from, failedCount: count }
        });
      }
    }

    // Emit alerts
    for (const alert of alerts) {
      this.emit('alert', alert);
    }

    return alerts;
  }

  // Watch an address for transactions
  watchAddress(address) {
    this.watchedAddresses.add(address.toLowerCase());
    this.emit('addressWatched', address);
  }

  // Stop watching an address
  unwatchAddress(address) {
    this.watchedAddresses.delete(address.toLowerCase());
    this.emit('addressUnwatched', address);
  }

  // Watch a contract for specific events
  async watchContract(chainId, address, abi, eventNames = []) {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`Chain ${chainId} not connected`);
    }

    const contract = new ethers.Contract(address, abi, provider);
    const key = `${chainId}:${address.toLowerCase()}`;

    // Setup event listeners
    const listeners = [];
    for (const eventName of eventNames) {
      const listener = (...args) => {
        const event = args[args.length - 1];
        this.emit('contractEvent', {
          chainId,
          address,
          eventName,
          args: args.slice(0, -1),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      };
      contract.on(eventName, listener);
      listeners.push({ eventName, listener });
    }

    this.watchedContracts.set(key, { contract, listeners });
    this.emit('contractWatched', { chainId, address, events: eventNames });
  }

  // Stop watching a contract
  unwatchContract(chainId, address) {
    const key = `${chainId}:${address.toLowerCase()}`;
    const watched = this.watchedContracts.get(key);

    if (watched) {
      for (const { eventName, listener } of watched.listeners) {
        watched.contract.off(eventName, listener);
      }
      this.watchedContracts.delete(key);
      this.emit('contractUnwatched', { chainId, address });
    }
  }

  // Track pending transaction
  trackPendingTransaction(hash, metadata = {}) {
    this.pendingTransactions.set(hash, {
      hash,
      metadata,
      submittedAt: Date.now()
    });
    this.emit('pendingTransaction', { hash, metadata });
  }

  // Get transaction history for an address
  getTransactionHistory(address, limit = 50) {
    const addr = address.toLowerCase();
    return this.transactionHistory
      .filter(tx => tx.from?.toLowerCase() === addr || tx.to?.toLowerCase() === addr)
      .slice(0, limit);
  }

  // Get pending transactions
  getPendingTransactions() {
    return Array.from(this.pendingTransactions.values());
  }

  // Get statistics
  getStats() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const recentTxs = this.transactionHistory.filter(tx => tx.timestamp > last24h);

    return {
      totalTransactions: this.transactionHistory.length,
      last24hTransactions: recentTxs.length,
      successRate: recentTxs.length > 0
        ? (recentTxs.filter(tx => tx.status === 'success').length / recentTxs.length * 100).toFixed(2)
        : 0,
      watchedAddresses: this.watchedAddresses.size,
      watchedContracts: this.watchedContracts.size,
      pendingTransactions: this.pendingTransactions.size,
      connectedChains: this.providers.size
    };
  }

  // Set alert thresholds
  setAlertThreshold(type, value) {
    if (this.alertThresholds.hasOwnProperty(type)) {
      this.alertThresholds[type] = value;
    }
  }

  // Cleanup
  async disconnect() {
    for (const [chainId, provider] of this.providers) {
      provider.removeAllListeners();
    }
    for (const [key, watched] of this.watchedContracts) {
      for (const { eventName, listener } of watched.listeners) {
        watched.contract.off(eventName, listener);
      }
    }
    this.providers.clear();
    this.watchedContracts.clear();
    this.watchedAddresses.clear();
    this.emit('disconnected');
  }
}

// Singleton instance
let monitorInstance = null;

const getMonitor = () => {
  if (!monitorInstance) {
    monitorInstance = new TransactionMonitor();
  }
  return monitorInstance;
};

module.exports = {
  TransactionMonitor,
  getMonitor
};
