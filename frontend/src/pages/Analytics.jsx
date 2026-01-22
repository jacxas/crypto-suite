import { useState } from 'react';
import { useAccount } from 'wagmi';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiActivity, FiPieChart, FiBarChart2 } from 'react-icons/fi';

// Mock data - replace with actual API/contract calls
const PROTOCOL_STATS = {
  tvl: 12500000,
  tvlChange: 5.2,
  volume24h: 850000,
  volumeChange: -2.3,
  users: 4523,
  usersChange: 12.5,
  transactions: 15678,
  transactionsChange: 8.7,
};

const TVL_HISTORY = [
  { date: '2026-01-15', value: 10200000 },
  { date: '2026-01-16', value: 10800000 },
  { date: '2026-01-17', value: 11200000 },
  { date: '2026-01-18', value: 10900000 },
  { date: '2026-01-19', value: 11500000 },
  { date: '2026-01-20', value: 12100000 },
  { date: '2026-01-21', value: 12500000 },
];

const TOP_POOLS = [
  { name: 'ETH/CSUITE', tvl: 4200000, apr: 125.5, volume24h: 320000 },
  { name: 'CSUITE/USDC', tvl: 2800000, apr: 85.3, volume24h: 180000 },
  { name: 'ETH/USDC', tvl: 2100000, apr: 45.2, volume24h: 150000 },
  { name: 'DAI/USDC', tvl: 1800000, apr: 32.1, volume24h: 95000 },
];

const RECENT_TRANSACTIONS = [
  { type: 'Swap', from: 'ETH', to: 'CSUITE', amount: '2.5 ETH', user: '0x1234...5678', time: '2 min' },
  { type: 'Stake', from: 'CSUITE', to: '-', amount: '5000 CSUITE', user: '0xabcd...efgh', time: '5 min' },
  { type: 'Add Liquidity', from: 'ETH/CSUITE', to: '-', amount: '$12,500', user: '0x9876...5432', time: '8 min' },
  { type: 'Borrow', from: 'USDC', to: '-', amount: '10,000 USDC', user: '0x5555...6666', time: '12 min' },
  { type: 'NFT Sale', from: 'NFT #42', to: '-', amount: '1.5 ETH', user: '0x7777...8888', time: '15 min' },
];

function Analytics() {
  const { isConnected } = useAccount();
  const [timeRange, setTimeRange] = useState('7d');

  const formatNumber = (num) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num}`;
  };

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 ${color}/20 rounded-lg`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
        <div className={`flex items-center ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
          <span className="font-medium">{Math.abs(change)}%</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-400 mt-1">
            Estadísticas y métricas del protocolo en tiempo real
          </p>
        </div>
        <div className="flex space-x-2">
          {['24h', '7d', '30d', 'All'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm ${timeRange === range ? 'bg-primary-500' : 'bg-dark-200 hover:bg-dark-100'}`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="TVL Total"
          value={formatNumber(PROTOCOL_STATS.tvl)}
          change={PROTOCOL_STATS.tvlChange}
          icon={FiDollarSign}
          color="bg-blue-500"
        />
        <StatCard
          title="Volumen 24h"
          value={formatNumber(PROTOCOL_STATS.volume24h)}
          change={PROTOCOL_STATS.volumeChange}
          icon={FiActivity}
          color="bg-green-500"
        />
        <StatCard
          title="Usuarios Activos"
          value={PROTOCOL_STATS.users.toLocaleString()}
          change={PROTOCOL_STATS.usersChange}
          icon={FiPieChart}
          color="bg-purple-500"
        />
        <StatCard
          title="Transacciones"
          value={PROTOCOL_STATS.transactions.toLocaleString()}
          change={PROTOCOL_STATS.transactionsChange}
          icon={FiBarChart2}
          color="bg-yellow-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TVL Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">TVL Histórico</h2>
          <div className="h-64 flex items-end justify-between space-x-2">
            {TVL_HISTORY.map((day, index) => {
              const maxValue = Math.max(...TVL_HISTORY.map(d => d.value));
              const height = (day.value / maxValue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all hover:from-primary-500 hover:to-primary-300"
                    style={{ height: `${height}%` }}
                    title={`${formatNumber(day.value)}`}
                  />
                  <p className="text-xs text-gray-400 mt-2">{day.date.slice(8)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Distribución TVL por Producto</h2>
          <div className="space-y-4">
            {[
              { name: 'Yield Farming', value: 45, color: 'bg-blue-500' },
              { name: 'Lending', value: 25, color: 'bg-green-500' },
              { name: 'Staking', value: 20, color: 'bg-purple-500' },
              { name: 'NFT Marketplace', value: 10, color: 'bg-yellow-500' },
            ].map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.name}</span>
                  <span className="text-gray-400">{item.value}%</span>
                </div>
                <div className="h-3 bg-dark-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pools */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Top Pools</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3">Pool</th>
                  <th className="pb-3">TVL</th>
                  <th className="pb-3">APR</th>
                  <th className="pb-3">Vol 24h</th>
                </tr>
              </thead>
              <tbody>
                {TOP_POOLS.map((pool, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-3 font-medium">{pool.name}</td>
                    <td className="py-3">{formatNumber(pool.tvl)}</td>
                    <td className="py-3 text-green-400">{pool.apr}%</td>
                    <td className="py-3">{formatNumber(pool.volume24h)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Transacciones Recientes</h2>
          <div className="space-y-3">
            {RECENT_TRANSACTIONS.map((tx, index) => (
              <div key={index} className="flex items-center justify-between bg-dark-200 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    tx.type === 'Swap' ? 'bg-blue-500/20 text-blue-400' :
                    tx.type === 'Stake' ? 'bg-green-500/20 text-green-400' :
                    tx.type === 'Add Liquidity' ? 'bg-purple-500/20 text-purple-400' :
                    tx.type === 'Borrow' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {tx.type.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium">{tx.type}</p>
                    <p className="text-gray-400 text-sm">{tx.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{tx.amount}</p>
                  <p className="text-gray-400 text-sm">{tx.time} ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Stats (if connected) */}
      {isConnected && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Tus Estadísticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-dark-200 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Portfolio Total</p>
              <p className="text-2xl font-bold">$0.00</p>
            </div>
            <div className="bg-dark-200 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Ganancias Totales</p>
              <p className="text-2xl font-bold text-green-400">$0.00</p>
            </div>
            <div className="bg-dark-200 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Transacciones</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="bg-dark-200 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Fees Pagados</p>
              <p className="text-2xl font-bold">$0.00</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;
