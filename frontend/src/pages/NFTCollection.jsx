import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { getContractAddresses } from '../config/wagmi';
import { NFTCollectionABI } from '../contracts/NFTCollectionABI';

export default function NFTCollection() {
  const { address, isConnected, chain } = useAccount();
  const addresses = getContractAddresses(chain?.id);
  const [isMinting, setIsMinting] = useState(false);

  const { data: nftName } = useReadContract({
    address: addresses?.nft,
    abi: NFTCollectionABI,
    functionName: 'name',
    enabled: !!addresses?.nft,
  });

  const { data: nftSymbol } = useReadContract({
    address: addresses?.nft,
    abi: NFTCollectionABI,
    functionName: 'symbol',
    enabled: !!addresses?.nft,
  });

  const { data: totalSupply } = useReadContract({
    address: addresses?.nft,
    abi: NFTCollectionABI,
    functionName: 'totalSupply',
    enabled: !!addresses?.nft,
  });

  const { data: maxSupply } = useReadContract({
    address: addresses?.nft,
    abi: NFTCollectionABI,
    functionName: 'maxSupply',
    enabled: !!addresses?.nft,
  });

  const { data: mintPrice } = useReadContract({
    address: addresses?.nft,
    abi: NFTCollectionABI,
    functionName: 'mintPrice',
    enabled: !!addresses?.nft,
  });

  const { data: balance } = useReadContract({
    address: addresses?.nft,
    abi: NFTCollectionABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: isConnected && !!addresses?.nft,
  });

  const { writeContract: mint, data: mintHash } = useWriteContract();
  const { isLoading: isMintLoading } = useWaitForTransactionReceipt({ hash: mintHash });

  const handleMint = async () => {
    if (!addresses?.nft || !mintPrice) return;

    try {
      setIsMinting(true);
      mint({
        address: addresses.nft,
        abi: NFTCollectionABI,
        functionName: 'mint',
        value: mintPrice,
      });
    } catch (error) {
      console.error('Mint error:', error);
    } finally {
      setIsMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold mb-4">Conecta tu wallet</h1>
        <p className="text-gray-400">Para mintear NFTs</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">NFT Collection</h1>
        <p className="text-gray-400">Mintea y gestiona tus NFTs</p>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-gray-400 mb-2">Tus NFTs</p>
          <p className="text-3xl font-bold">{balance?.toString() || '0'}</p>
          <p className="text-sm text-gray-500 mt-1">NFTs</p>
        </div>

        <div className="card">
          <p className="text-gray-400 mb-2">Total Minteados</p>
          <p className="text-3xl font-bold">{totalSupply?.toString() || '0'}</p>
          <p className="text-sm text-gray-500 mt-1">de {maxSupply?.toString() || '0'}</p>
        </div>

        <div className="card">
          <p className="text-gray-400 mb-2">Precio Mint</p>
          <p className="text-3xl font-bold">
            {mintPrice ? parseFloat(formatEther(mintPrice)).toFixed(3) : '0.000'}
          </p>
          <p className="text-sm text-gray-500 mt-1">ETH</p>
        </div>

        <div className="card">
          <p className="text-gray-400 mb-2">Disponibles</p>
          <p className="text-3xl font-bold">
            {maxSupply && totalSupply ? (Number(maxSupply) - Number(totalSupply)).toString() : '0'}
          </p>
          <p className="text-sm text-gray-500 mt-1">NFTs</p>
        </div>
      </div>

      {/* Mint Section */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4">🎨 Mintear NFT</h2>
            <p className="text-gray-400 mb-6">
              Mintea un nuevo NFT de la colección {nftName || 'NFT Collection'}.
              Cada NFT es único y se almacena en la blockchain.
            </p>
            <div className="space-y-4">
              <div className="flex justify-between p-4 bg-dark-200 rounded-lg">
                <span className="text-gray-400">Colección</span>
                <span className="font-medium">{nftName || 'NFT Collection'}</span>
              </div>
              <div className="flex justify-between p-4 bg-dark-200 rounded-lg">
                <span className="text-gray-400">Símbolo</span>
                <span className="font-medium">{nftSymbol || 'NFT'}</span>
              </div>
              <div className="flex justify-between p-4 bg-dark-200 rounded-lg">
                <span className="text-gray-400">Precio</span>
                <span className="font-medium">
                  {mintPrice ? formatEther(mintPrice) : '0'} ETH
                </span>
              </div>
            </div>
            <button
              onClick={handleMint}
              disabled={isMinting || isMintLoading}
              className="btn-primary w-full mt-6"
            >
              {isMinting || isMintLoading ? 'Minteando...' : '🎨 Mintear NFT'}
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full aspect-square bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-8xl">🖼️</span>
            </div>
          </div>
        </div>
      </div>

      {/* My NFTs */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">👛 Mis NFTs</h2>
        {balance && Number(balance) > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: Number(balance) }).map((_, i) => (
              <div key={i} className="bg-dark-200 rounded-lg p-4">
                <div className="aspect-square bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-4xl">🖼️</span>
                </div>
                <p className="font-medium">NFT #{i + 1}</p>
                <p className="text-sm text-gray-400">{nftSymbol}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No tienes NFTs aún</p>
            <p className="text-sm mt-2">Mintea tu primer NFT arriba</p>
          </div>
        )}
      </div>
    </div>
  );
}
