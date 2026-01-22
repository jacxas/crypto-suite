import { Outlet, NavLink } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FiHome, FiLayers, FiImage, FiLock, FiUsers, FiDroplet, FiCheckSquare, FiDollarSign, FiActivity, FiUser } from 'react-icons/fi';
import { GiHammer } from 'react-icons/gi';

const navItems = [
  { path: '/', icon: FiHome, label: 'Dashboard' },
  { path: '/staking', icon: FiLayers, label: 'Staking' },
  { path: '/farming', icon: FiDroplet, label: 'Yield Farming' },
  { path: '/lending', icon: FiDollarSign, label: 'Préstamos' },
  { path: '/nft', icon: FiImage, label: 'NFT Marketplace' },
  { path: '/auctions', icon: FiActivity, label: 'Subastas NFT' },
  { path: '/governance', icon: FiCheckSquare, label: 'Gobernanza' },
  { path: '/escrow', icon: FiLock, label: 'Escrow' },
  { path: '/multisig', icon: FiUsers, label: 'MultiSig' },
  { path: '/analytics', icon: FiActivity, label: 'Analytics' },
  { path: '/profile', icon: FiUser, label: 'Perfil' },
];

function Layout() {
  return (
    <div className="min-h-screen bg-dark-300">
      {/* Header */}
      <header className="bg-dark-200 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🧠</span>
              <h1 className="text-xl font-bold gradient-text">Crypto Suite</h1>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-dark-200 border-r border-gray-700 min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:bg-dark-100 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
