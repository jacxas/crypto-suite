import { useState } from 'react';
import { useAccount } from 'wagmi';
import { FiGrid, FiList, FiSearch } from 'react-icons/fi';

// Mock NFT data - replace with actual contract data
const mockNFTs = [
  { id: 1, name: 'Crypto Punk #1234', price: '0.5', image: 'https://via.placeholder.com/300/1e293b/0ea5e9?text=NFT+1' },
  { id: 2, name: 'Bored Ape #5678', price: '1.2', image: 'https://via.placeholder.com/300/1e293b/0ea5e9?text=NFT+2' },
  { id: 3, name: 'Azuki #9012', price: '0.8', image: 'https://via.placeholder.com/300/1e293b/0ea5e9?text=NFT+3' },
  { id: 4, name: 'Doodle #3456', price: '0.3', image: 'https://via.placeholder.com/300/1e293b/0ea5e9?text=NFT+4' },
];

function NFTCard({ nft }) {
  return (
    <div className="card hover:border-primary-500 transition-colors cursor-pointer group">
      <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-dark-200">
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <h3 className="font-semibold truncate">{nft.name}</h3>
      <div className="flex justify-between items-center mt-2">
        <span className="text-gray-400 text-sm">Precio</span>
        <span className="font-bold text-primary-400">{nft.price} ETH</span>
      </div>
      <button className="btn-primary w-full mt-4">
        Comprar
      </button>
    </div>
  );
}

function NFTMarketplace() {
  const { isConnected } = useAccount();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🖼️</div>
        <h2 className="text-2xl font-bold mb-2">Conecta tu Wallet</h2>
        <p className="text-gray-400">Necesitas conectar tu wallet para ver el marketplace</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">NFT Marketplace</h1>
          <p className="text-gray-400 mt-1">Descubre, compra y vende NFTs únicos</p>
        </div>
        <button className="btn-primary">
          + Crear NFT
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar NFTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-dark-200 text-gray-400'
              }`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-dark-200 text-gray-400'
              }`}
            >
              <FiList className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* NFT Grid */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {mockNFTs.map((nft) => (
          <NFTCard key={nft.id} nft={nft} />
        ))}
      </div>

      {/* Empty State */}
      {mockNFTs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👀</div>
          <p className="text-gray-400">No se encontraron NFTs</p>
        </div>
      )}
    </div>
  );
}

export default NFTMarketplace;
