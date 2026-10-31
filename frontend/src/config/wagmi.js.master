import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia, polygon, localhost } from 'wagmi/chains';

// Contract addresses - update after deployment
export const CONTRACT_ADDRESSES = {
  localhost: {
    token: import.meta.env.VITE_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    nft: import.meta.env.VITE_NFT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    marketplace: import.meta.env.VITE_MARKETPLACE_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  },
  sepolia: {
    token: import.meta.env.VITE_TOKEN_ADDRESS || '',
    nft: import.meta.env.VITE_NFT_ADDRESS || '',
    marketplace: import.meta.env.VITE_MARKETPLACE_ADDRESS || '',
  },
  mainnet: {
    token: import.meta.env.VITE_TOKEN_ADDRESS || '',
    nft: import.meta.env.VITE_NFT_ADDRESS || '',
    marketplace: import.meta.env.VITE_MARKETPLACE_ADDRESS || '',
  },
};

// Hardhat localhost chain config
const hardhatLocalhost = {
  ...localhost,
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
};

export const config = getDefaultConfig({
  appName: 'Crypto Suite',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [hardhatLocalhost, sepolia, mainnet, polygon],
  transports: {
    [hardhatLocalhost.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
  },
});

export const getContractAddresses = (chainId) => {
  switch (chainId) {
    case 31337:
    case 1337:
      return CONTRACT_ADDRESSES.localhost;
    case 11155111:
      return CONTRACT_ADDRESSES.sepolia;
    case 1:
      return CONTRACT_ADDRESSES.mainnet;
    default:
      return CONTRACT_ADDRESSES.localhost;
  }
};
