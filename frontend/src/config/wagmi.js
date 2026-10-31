import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, sepolia, localhost, arbitrum, optimism, base, bsc } from 'wagmi/chains';

// WalletConnect v2 configuration with extended chain support
export const config = getDefaultConfig({
  appName: 'Crypto Suite',
  projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [localhost, sepolia, mainnet, polygon, arbitrum, optimism, base, bsc],
  ssr: false,
});

// Supported chains metadata
export const SUPPORTED_CHAINS = {
  1: { name: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io' },
  137: { name: 'Polygon', symbol: 'MATIC', explorer: 'https://polygonscan.com' },
  42161: { name: 'Arbitrum', symbol: 'ETH', explorer: 'https://arbiscan.io' },
  10: { name: 'Optimism', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io' },
  8453: { name: 'Base', symbol: 'ETH', explorer: 'https://basescan.org' },
  56: { name: 'BSC', symbol: 'BNB', explorer: 'https://bscscan.com' },
  11155111: { name: 'Sepolia', symbol: 'ETH', explorer: 'https://sepolia.etherscan.io' },
  31337: { name: 'Localhost', symbol: 'ETH', explorer: '' },
};

// Contract addresses - update after deployment
export const CONTRACT_ADDRESSES = {
  localhost: {
    token: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    nft: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    marketplace: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    multiContract: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  },
  sepolia: {
    token: '',
    nft: '',
    marketplace: '',
    multiContract: '',
  },
  polygon: {
    token: '',
    nft: '',
    marketplace: '',
    multiContract: '',
  },
};

// Devuelve las direcciones de contrato para la cadena activa.
// Anadido para las paginas de la A-Suite (Token.jsx usa esta firma).
export const getContractAddresses = (chainId) => {
  switch (chainId) {
    case 31337:
    case 1337:
      return CONTRACT_ADDRESSES.localhost;
    case 11155111:
      return CONTRACT_ADDRESSES.sepolia;
    case 137:
      return CONTRACT_ADDRESSES.polygon;
    default:
      return CONTRACT_ADDRESSES.localhost;
  }
};

