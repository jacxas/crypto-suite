import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/faucet', label: 'Faucet', icon: '🚰' },
  { path: '/token', label: 'Token', icon: '🪙' },
  { path: '/nft', label: 'NFT Collection', icon: '🖼️' },
  { path: '/marketplace', label: 'Marketplace', icon: '🛍️' },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-300">
      {/* Header */}
      <header className="bg-dark-200 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🔗</span>
                <span className="text-xl font-bold gradient-text">Crypto Suite</span>
              </Link>
              <nav className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-dark-100'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-200 border-t border-gray-800 z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center px-3 py-2 text-xs ${
                location.pathname === item.path
                  ? 'text-primary-500'
                  : 'text-gray-400'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
