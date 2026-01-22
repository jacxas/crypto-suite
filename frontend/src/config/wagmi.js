import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, sepolia, localhost } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Crypto Suite',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [localhost, sepolia, polygon, mainnet],
  ssr: false,
});

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
