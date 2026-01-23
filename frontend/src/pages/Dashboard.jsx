import { useAccount, useBalance } from 'wagmi';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddresses } from '../config/wagmi';
import { AdvancedTokenABI } from '../contracts/AdvancedTokenABI';

export default function Dashboard() {
  const { address, isConnected, chain } = useAccount();
  const addresses = getContractAddresses(chain?.id);

  const { data: ethBalance } = useBalance({ address });
  
  const { data: tokenBalance } = useReadContract({
    address: addresses?.token,
    abi: AdvancedTokenABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: isConnected && !!addresses?.token,
  });

  const { data: tokenName } = useReadContract({
    address: addresses?.token,
    abi: AdvancedTokenABI,
    functionName: 'name',
    enabled: !!addresses?.token,
  });

  const { data: tokenSymbol } = useReadContract({
    address: addresses?.token,
    abi: AdvancedTokenABI,
    functionName: 'symbol',
    enabled: !!addresses?.token,
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🔐</div>
        <h1 className="text-3xl font-bold mb-4">Bienvenido a Crypto Suite</h1>
        <p className="text-gray-400 text-center max-w-md mb-8">
          Conecta tu wallet para acceder al dashboard y gestionar tus tokens y NFTs.
        </p>
        <div className="card p-8 text-center">
          <p className="text-gray-400">Haz clic en "Connect Wallet" en la esquina superior derecha</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Resumen de tu cuenta y activos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Balance ETH</span>
            <span className="text-2xl">Ξ</span>
          </div>
          <p className="text-2xl font-bold">
            {ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : '0.0000'}
          </p>
          <p className="text-sm text-gray-500">ETH</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Balance Token</span>
            <span className="text-2xl">🪙</span>
          </div>
          <p className="text-2xl font-bold">
            {tokenBalance ? parseFloat(formatEther(tokenBalance)).toFixed(2) : '0.00'}
          </p>
          <p className="text-sm text-gray-500">{tokenSymbol || 'TOKEN'}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Red</span>
            <span className="text-2xl">🌐</span>
          </div>
          <p className="text-2xl font-bold">{chain?.name || 'Desconectado'}</p>
          <p className="text-sm text-gray-500">Chain ID: {chain?.id || '-'}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Wallet</span>
            <span className="text-2xl">👛</span>
          </div>
          <p className="text-lg font-mono truncate">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
          <p className="text-sm text-gray-500">Conectada</p>
        </div>
      </div>

      {/* Contract Info */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Contratos Desplegados</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-dark-200 rounded-lg">
            <div>
              <p className="font-medium">{tokenName || 'AdvancedToken'}</p>
              <p className="text-sm text-gray-400">Token ERC20</p>
            </div>
            <code className="text-xs bg-dark-300 px-3 py-1 rounded font-mono">
              {addresses?.token?.slice(0, 10)}...{addresses?.token?.slice(-8)}
            </code>
          </div>
          <div className="flex justify-between items-center p-4 bg-dark-200 rounded-lg">
            <div>
              <p className="font-medium">NFT Collection</p>
              <p className="text-sm text-gray-400">Colección ERC721</p>
            </div>
            <code className="text-xs bg-dark-300 px-3 py-1 rounded font-mono">
              {addresses?.nft?.slice(0, 10)}...{addresses?.nft?.slice(-8)}
            </code>
          </div>
          <div className="flex justify-between items-center p-4 bg-dark-200 rounded-lg">
            <div>
              <p className="font-medium">NFT Marketplace</p>
              <p className="text-sm text-gray-400">Marketplace</p>
            </div>
            <code className="text-xs bg-dark-300 px-3 py-1 rounded font-mono">
              {addresses?.marketplace?.slice(0, 10)}...{addresses?.marketplace?.slice(-8)}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
