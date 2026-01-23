import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { getContractAddresses } from '../config/wagmi';
import { AdvancedTokenABI } from '../contracts/AdvancedTokenABI';

export default function Token() {
  const { address, isConnected, chain } = useAccount();
  const addresses = getContractAddresses(chain?.id);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const { data: balance } = useReadContract({
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

  const { data: totalSupply } = useReadContract({
    address: addresses?.token,
    abi: AdvancedTokenABI,
    functionName: 'totalSupply',
    enabled: !!addresses?.token,
  });

  const { writeContract: transfer, data: transferHash } = useWriteContract();
  const { isLoading: isTransferring } = useWaitForTransactionReceipt({ hash: transferHash });

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferTo || !transferAmount) return;

    try {
      transfer({
        address: addresses.token,
        abi: AdvancedTokenABI,
        functionName: 'transfer',
        args: [transferTo, parseEther(transferAmount)],
      });
    } catch (error) {
      console.error('Transfer error:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold mb-4">Conecta tu wallet</h1>
        <p className="text-gray-400">Para gestionar tus tokens</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Token ERC20</h1>
        <p className="text-gray-400">Gestiona tu {tokenName || 'AdvancedToken'}</p>
      </div>

      {/* Token Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-gray-400 mb-2">Tu Balance</p>
          <p className="text-3xl font-bold">
            {balance ? parseFloat(formatEther(balance)).toFixed(2) : '0.00'}
          </p>
          <p className="text-sm text-gray-500 mt-1">{tokenSymbol || 'TOKEN'}</p>
        </div>

        <div className="card">
          <p className="text-gray-400 mb-2">Total Supply</p>
          <p className="text-3xl font-bold">
            {totalSupply ? parseFloat(formatEther(totalSupply)).toFixed(0) : '0'}
          </p>
          <p className="text-sm text-gray-500 mt-1">{tokenSymbol || 'TOKEN'}</p>
        </div>

        <div className="card">
          <p className="text-gray-400 mb-2">Contrato</p>
          <code className="text-sm font-mono block truncate">
            {addresses?.token?.slice(0, 10)}...{addresses?.token?.slice(-8)}
          </code>
          <a
            href={`https://etherscan.io/address/${addresses?.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-500 hover:underline mt-2 inline-block"
          >
            Ver en Etherscan ↗
          </a>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">💸 Transferir Tokens</h2>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Dirección destino</label>
            <input
              type="text"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder="0x..."
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cantidad</label>
            <input
              type="number"
              step="0.01"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0.00"
              className="input w-full"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isTransferring}
            className="btn-primary w-full"
          >
            {isTransferring ? 'Transfiriendo...' : 'Transferir'}
          </button>
        </form>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">📊 Transacciones Recientes</h2>
        <div className="text-center py-8 text-gray-400">
          <p>No hay transacciones recientes</p>
          <p className="text-sm mt-2">Las transacciones aparecerán aquí</p>
        </div>
      </div>
    </div>
  );
}
