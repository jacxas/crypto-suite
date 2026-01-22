export const MultiContractABI = [
  // Staking Functions
  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "calculateRewards",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getStakeInfo",
    "outputs": [
      {"name": "amount", "type": "uint256"},
      {"name": "startTime", "type": "uint256"},
      {"name": "lastClaimTime", "type": "uint256"},
      {"name": "pendingRewards", "type": "uint256"},
      {"name": "active", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // NFT Escrow Functions
  {
    "inputs": [
      {"name": "nftContract", "type": "address"},
      {"name": "tokenId", "type": "uint256"},
      {"name": "price", "type": "uint256"},
      {"name": "duration", "type": "uint256"}
    ],
    "name": "createEscrow",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "escrowId", "type": "uint256"}],
    "name": "completeEscrow",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "escrowId", "type": "uint256"}],
    "name": "cancelEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "escrowId", "type": "uint256"}],
    "name": "getEscrowInfo",
    "outputs": [
      {"name": "nftContract", "type": "address"},
      {"name": "tokenId", "type": "uint256"},
      {"name": "seller", "type": "address"},
      {"name": "buyer", "type": "address"},
      {"name": "price", "type": "uint256"},
      {"name": "completed", "type": "bool"},
      {"name": "deadline", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Time Lock Functions
  {
    "inputs": [
      {"name": "recipient", "type": "address"},
      {"name": "releaseTime", "type": "uint256"}
    ],
    "name": "createTimeLock",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "lockId", "type": "uint256"}],
    "name": "executeTimeLock",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // MultiSig Functions
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "value", "type": "uint256"},
      {"name": "data", "type": "bytes"}
    ],
    "name": "submitMultiSigTx",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "txId", "type": "uint256"}],
    "name": "confirmMultiSigTx",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSigners",
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  // State Variables
  {
    "inputs": [],
    "name": "totalStaked",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardRate",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "escrowCounter",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "timestamp", "type": "uint256"}
    ],
    "name": "Staked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "timestamp", "type": "uint256"}
    ],
    "name": "Unstaked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "timestamp", "type": "uint256"}
    ],
    "name": "RewardsClaimed",
    "type": "event"
  }
];
