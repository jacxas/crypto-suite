import { useState } from 'react';
import { useAccount } from 'wagmi';
import { FiClock, FiDollarSign, FiTrendingUp, FiHeart, FiEye, FiPlus } from 'react-icons/fi';

// Mock auctions - replace with contract calls
const AUCTIONS = [
  {
    id: 1,
    name: 'Cosmic Voyager #42',
    image: 'https://picsum.photos/seed/nft1/400/400',
    seller: '0x1234...5678',
    auctionType: 'english',
    currentBid: 2.5,
    minBid: 0.1,
    buyNowPrice: 5.0,
    endTime: Date.now() + 86400000 * 1,
    bids: 12,
    views: 234,
  },
  {
    id: 2,
    name: 'Digital Dreams #88',
    image: 'https://picsum.photos/seed/nft2/400/400',
    seller: '0xabcd...efgh',
    auctionType: 'dutch',
    currentBid: 1.8,
    startPrice: 3.0,
    endPrice: 0.5,
    endTime: Date.now() + 86400000 * 2,
    bids: 0,
    views: 156,
  },
  {
    id: 3,
    name: 'Neon Genesis #7',
    image: 'https://picsum.photos/seed/nft3/400/400',
    seller: '0x9876...5432',
    auctionType: 'english',
    currentBid: 0.8,
    minBid: 0.05,
    buyNowPrice: 2.0,
    endTime: Date.now() + 3600000 * 5,
    bids: 8,
    views: 89,
  },
  {
    id: 4,
    name: 'Abstract Reality #21',
    image: 'https://picsum.photos/seed/nft4/400/400',
    seller: '0x5555...6666',
    auctionType: 'dutch',
    currentBid: 4.2,
    startPrice: 6.0,
    endPrice: 1.0,
    endTime: Date.now() + 86400000 * 3,
    bids: 0,
    views: 312,
  },
];

function NFTAuctions() {
  const { isConnected } = useAccount();
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [filter, setFilter] = useState('all'); // all, english, dutch
  const [showCreateModal, setShowCreateModal] = useState(false);

  const formatTimeRemaining = (endTime) => {
    const diff = endTime - Date.now();
    if (diff <= 0) return 'Finalizada';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const filteredAuctions = AUCTIONS.filter(a => 
    filter === 'all' || a.auctionType === filter
  );

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🔨</div>
        <h2 className="text-2xl font-bold mb-2">Conecta tu Wallet</h2>
        <p className="text-gray-400">Necesitas conectar tu wallet para participar en subastas</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Subastas NFT</h1>
          <p className="text-gray-400 mt-1">
            Participa en subastas English y Dutch para NFTs exclusivos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus /> <span>Crear Subasta</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Subastas Activas</p>
              <p className="text-xl font-bold">{AUCTIONS.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Volumen Total</p>
              <p className="text-xl font-bold">45.8 ETH</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FiHeart className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Tus Pujas</p>
              <p className="text-xl font-bold">0</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <FiClock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Finalizando Pronto</p>
              <p className="text-xl font-bold">{AUCTIONS.filter(a => a.endTime - Date.now() < 86400000).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {['all', 'english', 'dutch'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize ${filter === f ? 'bg-primary-500' : 'bg-dark-200 hover:bg-dark-100'}`}
          >
            {f === 'all' ? 'Todas' : f === 'english' ? 'English' : 'Dutch'}
          </button>
        ))}
      </div>

      {/* Auctions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredAuctions.map((auction) => (
          <div
            key={auction.id}
            className="card p-0 overflow-hidden hover:border-primary-500 cursor-pointer transition-all hover:scale-[1.02]"
            onClick={() => setSelectedAuction(auction)}
          >
            <div className="relative">
              <img
                src={auction.image}
                alt={auction.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${auction.auctionType === 'english' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                  {auction.auctionType === 'english' ? 'English' : 'Dutch'}
                </span>
              </div>
              <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-lg flex items-center space-x-1">
                <FiClock className="w-3 h-3" />
                <span className="text-xs">{formatTimeRemaining(auction.endTime)}</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">{auction.name}</h3>
              <p className="text-gray-400 text-sm mb-3">Por {auction.seller}</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-xs">{auction.auctionType === 'english' ? 'Puja actual' : 'Precio actual'}</p>
                  <p className="font-bold text-lg">{auction.currentBid} ETH</p>
                </div>
                <div className="flex items-center space-x-3 text-gray-400 text-sm">
                  <span className="flex items-center"><FiEye className="mr-1" />{auction.views}</span>
                  {auction.auctionType === 'english' && (
                    <span className="flex items-center"><FiTrendingUp className="mr-1" />{auction.bids}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Auction Detail Modal */}
      {selectedAuction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedAuction.name}</h3>
              <button
                onClick={() => setSelectedAuction(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedAuction.image}
                  alt={selectedAuction.name}
                  className="w-full rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedAuction.auctionType === 'english' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                    Subasta {selectedAuction.auctionType === 'english' ? 'English' : 'Dutch'}
                  </span>
                </div>

                <div className="bg-dark-200 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Precio Actual</p>
                  <p className="text-3xl font-bold">{selectedAuction.currentBid} ETH</p>
                  <p className="text-gray-400 text-sm mt-1">~${(selectedAuction.currentBid * 2500).toLocaleString()} USD</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-200 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Tiempo Restante</p>
                    <p className="font-bold">{formatTimeRemaining(selectedAuction.endTime)}</p>
                  </div>
                  <div className="bg-dark-200 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">{selectedAuction.auctionType === 'english' ? 'Pujas' : 'Tipo'}</p>
                    <p className="font-bold">{selectedAuction.auctionType === 'english' ? selectedAuction.bids : 'Precio Decreciente'}</p>
                  </div>
                </div>

                {selectedAuction.auctionType === 'english' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-gray-400 text-sm">Tu Puja (mín. {selectedAuction.currentBid + selectedAuction.minBid} ETH)</label>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`${selectedAuction.currentBid + selectedAuction.minBid}`}
                        className="input-field w-full mt-1"
                      />
                    </div>
                    <button className="btn-primary w-full">Hacer Puja</button>
                    {selectedAuction.buyNowPrice && (
                      <button className="btn-secondary w-full">
                        Comprar Ahora por {selectedAuction.buyNowPrice} ETH
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-dark-200 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">Precio Inicial → Final</p>
                      <p className="font-bold">{selectedAuction.startPrice} ETH → {selectedAuction.endPrice} ETH</p>
                    </div>
                    <button className="btn-primary w-full">
                      Comprar por {selectedAuction.currentBid} ETH
                    </button>
                  </div>
                )}

                <div className="text-sm text-gray-400">
                  <p>Vendedor: {selectedAuction.seller}</p>
                  <p>Royalties: 5%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Auction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Crear Subasta</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">NFT Token ID</label>
                <input type="text" placeholder="Token ID" className="input-field w-full mt-1" />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Tipo de Subasta</label>
                <select className="input-field w-full mt-1">
                  <option value="english">English (Precio Ascendente)</option>
                  <option value="dutch">Dutch (Precio Descendente)</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Precio Inicial (ETH)</label>
                <input type="number" placeholder="0.0" className="input-field w-full mt-1" />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Duración</label>
                <select className="input-field w-full mt-1">
                  <option value="1">1 día</option>
                  <option value="3">3 días</option>
                  <option value="7">7 días</option>
                </select>
              </div>
              <button className="btn-primary w-full">Crear Subasta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NFTAuctions;
