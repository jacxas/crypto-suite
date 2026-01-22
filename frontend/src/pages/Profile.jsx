import { useState } from 'react';
import { useAccount } from 'wagmi';
import { FiUser, FiCopy, FiExternalLink, FiSettings, FiShield, FiBell, FiGlobe, FiCheck } from 'react-icons/fi';

function Profile() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    darkMode: true,
    language: 'es',
  });

  // Mock user data - replace with actual data
  const userData = {
    totalValue: 0,
    stakedAmount: 0,
    lpTokens: 0,
    nftsOwned: 0,
    borrowedAmount: 0,
    suppliedAmount: 0,
    votingPower: 0,
    proposalsVoted: 0,
  };

  const transactions = [
    { type: 'Stake', amount: '1000 CSUITE', date: '2026-01-20', status: 'completed' },
    { type: 'Swap', amount: '0.5 ETH → 500 CSUITE', date: '2026-01-19', status: 'completed' },
    { type: 'Add Liquidity', amount: '0.2 ETH + 200 CSUITE', date: '2026-01-18', status: 'completed' },
  ];

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">👤</div>
        <h2 className="text-2xl font-bold mb-2">Conecta tu Wallet</h2>
        <p className="text-gray-400">Necesitas conectar tu wallet para ver tu perfil</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
            <FiUser className="w-12 h-12" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">Mi Perfil</h1>
            <div className="flex items-center justify-center md:justify-start space-x-2 mt-2">
              <code className="bg-dark-200 px-3 py-1 rounded-lg text-sm">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </code>
              <button
                onClick={copyAddress}
                className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
                title="Copiar dirección"
              >
                {copied ? <FiCheck className="text-green-400" /> : <FiCopy />}
              </button>
              <a
                href={`https://etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
                title="Ver en Etherscan"
              >
                <FiExternalLink />
              </a>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-gray-400 text-sm">Valor Total del Portfolio</p>
            <p className="text-3xl font-bold">${userData.totalValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-700 pb-2">
        {[
          { id: 'overview', label: 'Resumen', icon: FiUser },
          { id: 'activity', label: 'Actividad', icon: FiShield },
          { id: 'settings', label: 'Configuración', icon: FiSettings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id ? 'bg-primary-500' : 'hover:bg-dark-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-gray-400 text-sm">Staked</p>
              <p className="text-xl font-bold">{userData.stakedAmount} CSUITE</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-sm">LP Tokens</p>
              <p className="text-xl font-bold">{userData.lpTokens}</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-sm">NFTs</p>
              <p className="text-xl font-bold">{userData.nftsOwned}</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-sm">Poder de Voto</p>
              <p className="text-xl font-bold">{userData.votingPower} CSUITE</p>
            </div>
          </div>

          {/* Lending Position */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Posición de Préstamos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-200 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Suministrado</p>
                <p className="text-2xl font-bold text-green-400">${userData.suppliedAmount}</p>
              </div>
              <div className="bg-dark-200 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Prestado</p>
                <p className="text-2xl font-bold text-red-400">${userData.borrowedAmount}</p>
              </div>
              <div className="bg-dark-200 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Factor de Salud</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>

          {/* Governance */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Participación en Gobernanza</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-dark-200 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Propuestas Votadas</p>
                <p className="text-2xl font-bold">{userData.proposalsVoted}</p>
              </div>
              <div className="bg-dark-200 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Propuestas Creadas</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Historial de Transacciones</h2>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between bg-dark-200 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'Stake' ? 'bg-green-500/20 text-green-400' :
                      tx.type === 'Swap' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {tx.type.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium">{tx.type}</p>
                      <p className="text-gray-400 text-sm">{tx.amount}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{tx.date}</p>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No hay transacciones aún</p>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Notifications */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiBell className="mr-2" /> Notificaciones
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones Push</p>
                  <p className="text-gray-400 text-sm">Recibe alertas sobre tus posiciones</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.notifications ? 'bg-primary-500' : 'bg-dark-200'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas por Email</p>
                  <p className="text-gray-400 text-sm">Recibe resúmenes diarios</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, emailAlerts: !settings.emailAlerts })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.emailAlerts ? 'bg-primary-500' : 'bg-dark-200'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.emailAlerts ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiGlobe className="mr-2" /> Apariencia
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo Oscuro</p>
                  <p className="text-gray-400 text-sm">Tema de la interfaz</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.darkMode ? 'bg-primary-500' : 'bg-dark-200'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div>
                <p className="font-medium mb-2">Idioma</p>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="input-field w-full md:w-48"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiShield className="mr-2" /> Seguridad
            </h2>
            <div className="space-y-4">
              <div className="bg-dark-200 rounded-lg p-4">
                <p className="font-medium">Wallet Conectada</p>
                <p className="text-gray-400 text-sm mt-1">{address}</p>
              </div>
              <button className="btn-secondary w-full md:w-auto">
                Desconectar Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
