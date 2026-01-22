import { useState } from 'react';
import { useAccount } from 'wagmi';
import { FiLock, FiUnlock, FiClock, FiCheck } from 'react-icons/fi';

function Escrow() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('create');
  const [escrowForm, setEscrowForm] = useState({
    nftContract: '',
    tokenId: '',
    price: '',
    duration: '7',
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🔐</div>
        <h2 className="text-2xl font-bold mb-2">Conecta tu Wallet</h2>
        <p className="text-gray-400">Necesitas conectar tu wallet para usar el escrow</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">NFT Escrow</h1>
        <p className="text-gray-400 mt-1">
          Sistema de custodia segura para trading de NFTs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FiLock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Escrows Activos</p>
              <p className="text-xl font-bold">0</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FiCheck className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Completados</p>
              <p className="text-xl font-bold">0</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FiClock className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pendientes</p>
              <p className="text-xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === 'create'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Crear Escrow
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === 'active'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Mis Escrows
        </button>
        <button
          onClick={() => setActiveTab('buy')}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === 'buy'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Comprar
        </button>
      </div>

      {/* Create Escrow Form */}
      {activeTab === 'create' && (
        <div className="card max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">Crear Nuevo Escrow</h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Contrato NFT</label>
              <input
                type="text"
                value={escrowForm.nftContract}
                onChange={(e) => setEscrowForm({ ...escrowForm, nftContract: e.target.value })}
                placeholder="0x..."
                className="input-field w-full mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Token ID</label>
              <input
                type="number"
                value={escrowForm.tokenId}
                onChange={(e) => setEscrowForm({ ...escrowForm, tokenId: e.target.value })}
                placeholder="1"
                className="input-field w-full mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Precio (ETH)</label>
              <input
                type="number"
                value={escrowForm.price}
                onChange={(e) => setEscrowForm({ ...escrowForm, price: e.target.value })}
                placeholder="0.1"
                className="input-field w-full mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Duración (días)</label>
              <select
                value={escrowForm.duration}
                onChange={(e) => setEscrowForm({ ...escrowForm, duration: e.target.value })}
                className="input-field w-full mt-1"
              >
                <option value="1">1 día</option>
                <option value="3">3 días</option>
                <option value="7">7 días</option>
                <option value="14">14 días</option>
                <option value="30">30 días</option>
              </select>
            </div>
            <button className="btn-primary w-full mt-6">
              Crear Escrow
            </button>
          </div>
        </div>
      )}

      {/* Active Escrows */}
      {activeTab === 'active' && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-gray-400">No tienes escrows activos</p>
          <button
            onClick={() => setActiveTab('create')}
            className="btn-primary mt-4"
          >
            Crear tu primer escrow
          </button>
        </div>
      )}

      {/* Buy Escrows */}
      {activeTab === 'buy' && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🛒</div>
          <p className="text-gray-400">No hay escrows disponibles para comprar</p>
        </div>
      )}
    </div>
  );
}

export default Escrow;
