import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { getContractAddresses } from '../config/wagmi';
import { NFTMarketplaceABI } from '../contracts/NFTMarketplaceABI';
import { NFTCollectionABI } from '../contracts/NFTCollectionABI';

export default function Marketplace() {
  const { address, isConnected, chain } = useAccount();
  const addresses = getContractAddresses(chain?.id);
  const [listingPrice, setListingPrice] = useState('');
  const [tokenId, setTokenId] = useState('');

  const { data: listingCounter } = useReadContract({
    address: addresses?.marketplace,
    abi: NFTMarketplaceABI,
    functionName: 'listingCounter',
    enabled: !!addresses?.marketplace,
  });

  const { data: marketplaceFee } = useReadContract({
    address: addresses?.marketplace,
    abi: NFTMarketplaceABI,
    functionName: 'marketplaceFee',
    enabled: !!addresses?.marketplace,
  });

  const { writeContract: listNFT, data: listHash } = useWriteContract();
  const { writeContract: buyNFT, data: buyHash } = useWriteContract();
  const { writeContract: approve, data: approveHash } = useWriteContract();
  
  const { isLoading: isListing } = useWaitForTransactionReceipt({ hash: listHash });
  const { isLoading: isBuying } = useWaitForTransactionReceipt({ hash: buyHash });
  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveHash });

  const handleApproveAndList = async (e) => {
    e.preventDefault();
    if (!tokenId || !listingPrice || !addresses?.nft || !addresses?.marketplace) return;

    try {
      // First approve marketplace
      approve({
        address: addresses.nft,
        abi: NFTCollectionABI,
        functionName: 'approve',
        args: [addresses.marketplace, BigInt(tokenId)],
      });

      // Then list (user needs to call this after approval)
      // listNFT({
      //   address: addresses.marketplace,
      //   abi: NFTMarketplaceABI,
      //   functionName: 'listNFTForETH',
      //   args: [addresses.nft, BigInt(tokenId), parseEther(listingPrice)],
      // });
    } catch (error) {
      console.error('List error:', error);
    }
  };

  const handleBuy = async (listingId, price) => {
    if (!addresses?.marketplace) return;

    try {
      buyNFT({
        address: addresses.marketplace,
        abi: NFTMarketplaceABI,
        functionName: 'buyNFTWithETH',
        args: [BigInt(listingId)],
        value: price,
      });
    } catch (error) {
      console.error('Buy error:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold mb-4">Conecta tu wallet</h1>
        <p className="text-gray-400">Para acceder al marketplace</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">NFT Marketplace</h1>
        <p className="text-gray-400">Compra y vende NFTs</p>
      </div>

      {/* Marketplace Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-gray-400 mb-2">Total Listings</p>
          <p className="text-3xl font-bold">{listingCounter?.toString() || '0'}</p>
          <p className="text-sm text-gray-500 mt-1">NFTs listados</p>
        </div>

        <div className="card">
          <p className="text-gray-400 mb-2">Fee del Marketplace</p>
          <p className="text-3xl font-bold">
            {marketplaceFee ? (Number(marketplaceFee) / 100).toFixed(1) : '0'}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Comisión por venta</p>
        </div>

        <div className="card">
          <p className="text-gray-400 mb-2">Volumen Total</p>
          <p className="text-3xl font-bold">0.00</p>
          <p className="text-sm text-gray-500 mt-1">ETH</p>
        </div>
      </div>

      {/* List NFT */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">📝 Listar NFT para Venta</h2>
        <form onSubmit={handleApproveAndList} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Token ID</label>
              <input
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                placeholder="1"
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Precio (ETH)</label>
              <input
                type="number"
                step="0.001"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                placeholder="0.1"
                className="input w-full"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isApproving || isListing}
            className="btn-primary w-full"
          >
            {isApproving ? 'Aprobando...' : isListing ? 'Listando...' : '📝 Aprobar y Listar NFT'}
          </button>
          <p className="text-xs text-gray-400">
            Nota: Primero debes aprobar el marketplace, luego podrás listar tu NFT
          </p>
        </form>
      </div>

      {/* Active Listings */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">🛍️ NFTs en Venta</h2>
        <div className="text-center py-8 text-gray-400">
          <p>No hay NFTs listados actualmente</p>
          <p className="text-sm mt-2">Sé el primero en listar un NFT</p>
        </div>
      </div>
    </div>
  );
}
