import { useAccount, useBalance } from 'wagmi';
import { FiTrendingUp, FiDollarSign, FiActivity, FiUsers } from 'react-icons/fi';

function StatCard({ icon: Icon, title, value, subtitle, color }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🔗</div>
        <h2 className="text-2xl font-bold mb-2">Conecta tu Wallet</h2>
        <p className="text-gray-400 text-center max-w-md">
          Conecta tu wallet para acceder a todas las funcionalidades de Crypto Suite:
          staking, NFTs, escrow y más.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Bienvenido a Crypto Suite - Tu plataforma DeFi todo en uno
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiDollarSign}
          title="Balance ETH"
          value={balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0 ETH'}
          subtitle="En tu wallet"
          color="bg-green-500/20 text-green-400"
        />
        <StatCard
          icon={FiTrendingUp}
          title="Total Staked"
          value="0 CSUITE"
          subtitle="En el protocolo"
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          icon={FiActivity}
          title="Recompensas"
          value="0 CSUITE"
          subtitle="Pendientes de reclamar"
          color="bg-purple-500/20 text-purple-400"
        />
        <StatCard
          icon={FiUsers}
          title="NFTs"
          value="0"
          subtitle="En tu colección"
          color="bg-orange-500/20 text-orange-400"
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/staking"
            className="p-4 bg-dark-200 rounded-lg border border-gray-700 hover:border-primary-500 transition-colors group"
          >
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-semibold group-hover:text-primary-400">Staking</h3>
            <p className="text-gray-400 text-sm">Gana recompensas con tus tokens</p>
          </a>
          <a
            href="/nft"
            className="p-4 bg-dark-200 rounded-lg border border-gray-700 hover:border-primary-500 transition-colors group"
          >
            <div className="text-2xl mb-2">🖼️</div>
            <h3 className="font-semibold group-hover:text-primary-400">NFT Marketplace</h3>
            <p className="text-gray-400 text-sm">Compra y vende NFTs</p>
          </a>
          <a
            href="/escrow"
            className="p-4 bg-dark-200 rounded-lg border border-gray-700 hover:border-primary-500 transition-colors group"
          >
            <div className="text-2xl mb-2">🔐</div>
            <h3 className="font-semibold group-hover:text-primary-400">Escrow</h3>
            <p className="text-gray-400 text-sm">Transacciones seguras</p>
          </a>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Tu Wallet</h2>
        <div className="bg-dark-200 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Dirección</p>
          <p className="font-mono text-sm break-all">{address}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
