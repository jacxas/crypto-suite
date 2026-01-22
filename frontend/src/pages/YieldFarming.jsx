import { useState } from 'react';
import { useAccount } from 'wagmi';
import { FiDroplet, FiTrendingUp, FiDollarSign, FiPercent, FiPlus, FiMinus } from 'react-icons/fi';

// Mock data for pools - replace with actual contract calls
const POOLS = [
  { id: 0, name: 'ETH/CSUITE', token0: 'ETH', token1: 'CSUITE', apr: 125.5, tvl: '1.2M', userStaked: '0', rewards: '0' },
  { id: 1, name: 'CSUITE/USDC', token0: 'CSUITE', token1: 'USDC', apr: 85.3, tvl: '850K', userStaked: '0', rewards: '0' },
  { id: 2, name: 'ETH/USDC', token0: 'ETH', token1: 'USDC', apr: 45.2, tvl: '2.5M', userStaked: '0', rewards: '0' },
];

function YieldFarming() {
  const { isConnected } = useAccount();
  const [selectedPool, setSelectedPool] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [activeTab, setActiveTab] = useState('deposit');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🌾</div>
        <h2 className="text-2xl font-bold mb-2">Conecta tu Wallet</h2>
        <p className="text-gray-400">Necesitas conectar tu wallet para hacer yield farming</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Yield Farming</h1>
        <p className="text-gray-400 mt-1">
          Proporciona liquidez y gana recompensas en múltiples pools
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">TVL Total</p>
              <p className="text-xl font-bold">$4.55M</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FiPercent className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">APR Promedio</p>
              <p className="text-xl font-bold">85.3%</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FiDroplet className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pools Activos</p>
              <p className="text-xl font-bold">{POOLS.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Tus Recompensas</p>
              <p className="text-xl font-bold">0 CSUITE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pools List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Pools Disponibles</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-3">Pool</th>
                <th className="pb-3">APR</th>
                <th className="pb-3">TVL</th>
                <th className="pb-3">Tu Stake</th>
                <th className="pb-3">Recompensas</th>
                <th className="pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {POOLS.map((pool) => (
                <tr key={pool.id} className="border-b border-gray-800 hover:bg-dark-200">
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                          {pool.token0.slice(0, 2)}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold">
                          {pool.token1.slice(0, 2)}
                        </div>
                      </div>
                      <span className="font-medium">{pool.name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-green-400 font-bold">{pool.apr}%</span>
                  </td>
                  <td className="py-4">${pool.tvl}</td>
                  <td className="py-4">{pool.userStaked} LP</td>
                  <td className="py-4">
                    <span className="text-yellow-400">{pool.rewards} CSUITE</span>
                  </td>
                  <td className="py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedPool(pool)}
                        className="btn-primary text-sm py-1 px-3"
                      >
                        <FiPlus className="inline mr-1" /> Depositar
                      </button>
                      <button className="btn-secondary text-sm py-1 px-3">
                        <FiMinus className="inline mr-1" /> Retirar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit/Withdraw Modal */}
      {selectedPool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedPool.name}</h3>
              <button
                onClick={() => setSelectedPool(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`flex-1 py-2 rounded-lg ${activeTab === 'deposit' ? 'bg-primary-500' : 'bg-dark-200'}`}
              >
                Depositar
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`flex-1 py-2 rounded-lg ${activeTab === 'withdraw' ? 'bg-primary-500' : 'bg-dark-200'}`}
              >
                Retirar
              </button>
            </div>

            {activeTab === 'deposit' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Cantidad de {selectedPool.token0}</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.0"
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Cantidad de {selectedPool.token1}</label>
                  <input
                    type="number"
                    placeholder="0.0"
                    className="input-field w-full mt-1"
                  />
                </div>
                <div className="bg-dark-200 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">APR Estimado</span>
                    <span className="text-green-400">{selectedPool.apr}%</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-400">LP Tokens a recibir</span>
                    <span>~0.00 LP</span>
                  </div>
                </div>
                <button className="btn-primary w-full">Aprobar y Depositar</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">LP Tokens a retirar</label>
                  <div className="flex space-x-2 mt-1">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.0"
                      className="input-field flex-1"
                    />
                    <button className="btn-secondary text-sm">MAX</button>
                  </div>
                </div>
                <div className="bg-dark-200 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Recibirás {selectedPool.token0}</span>
                    <span>~0.00</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-400">Recibirás {selectedPool.token1}</span>
                    <span>~0.00</span>
                  </div>
                </div>
                <button className="btn-primary w-full">Retirar Liquidez</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default YieldFarming;
