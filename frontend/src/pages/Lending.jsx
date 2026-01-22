import { useState } from 'react';
import { useAccount } from 'wagmi';
import { FiDollarSign, FiPercent, FiShield, FiAlertTriangle, FiArrowUp, FiArrowDown } from 'react-icons/fi';

// Mock markets - replace with contract calls
const MARKETS = [
  { symbol: 'ETH', name: 'Ethereum', supplyApy: 3.2, borrowApy: 5.8, totalSupply: '5.2M', totalBorrow: '2.1M', collateralFactor: 75, userSupplied: '0', userBorrowed: '0' },
  { symbol: 'CSUITE', name: 'CryptoSuite', supplyApy: 8.5, borrowApy: 12.3, totalSupply: '2.8M', totalBorrow: '1.2M', collateralFactor: 65, userSupplied: '0', userBorrowed: '0' },
  { symbol: 'USDC', name: 'USD Coin', supplyApy: 4.1, borrowApy: 6.2, totalSupply: '8.5M', totalBorrow: '4.3M', collateralFactor: 85, userSupplied: '0', userBorrowed: '0' },
  { symbol: 'DAI', name: 'Dai', supplyApy: 3.8, borrowApy: 5.9, totalSupply: '3.2M', totalBorrow: '1.8M', collateralFactor: 80, userSupplied: '0', userBorrowed: '0' },
];

function Lending() {
  const { isConnected } = useAccount();
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [actionType, setActionType] = useState('supply'); // supply, withdraw, borrow, repay
  const [amount, setAmount] = useState('');

  // Mock user position
  const userPosition = {
    totalSupplied: 0,
    totalBorrowed: 0,
    borrowLimit: 0,
    healthFactor: 0,
  };

  const getHealthColor = (health) => {
    if (health >= 2) return 'text-green-400';
    if (health >= 1.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🏦</div>
        <h2 className="text-2xl font-bold mb-2">Conecta tu Wallet</h2>
        <p className="text-gray-400">Necesitas conectar tu wallet para usar el protocolo de préstamos</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Préstamos</h1>
        <p className="text-gray-400 mt-1">
          Deposita colateral y pide prestado, o suministra liquidez y gana intereses
        </p>
      </div>

      {/* User Position */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FiArrowUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Suministrado</p>
              <p className="text-xl font-bold">${userPosition.totalSupplied.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <FiArrowDown className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Prestado</p>
              <p className="text-xl font-bold">${userPosition.totalBorrowed.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Límite de Préstamo</p>
              <p className="text-xl font-bold">${userPosition.borrowLimit.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FiShield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Factor de Salud</p>
              <p className={`text-xl font-bold ${getHealthColor(userPosition.healthFactor)}`}>
                {userPosition.healthFactor > 0 ? userPosition.healthFactor.toFixed(2) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Warning */}
      {userPosition.healthFactor > 0 && userPosition.healthFactor < 1.5 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center space-x-3">
          <FiAlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-yellow-400">Riesgo de Liquidación</p>
            <p className="text-sm text-gray-300">Tu factor de salud está bajo. Considera añadir más colateral o pagar parte de tu deuda.</p>
          </div>
        </div>
      )}

      {/* Markets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supply Markets */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Mercados de Suministro</h2>
          <div className="space-y-3">
            {MARKETS.map((market) => (
              <div
                key={market.symbol}
                className="bg-dark-200 rounded-lg p-4 hover:bg-dark-100 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedMarket(market);
                  setActionType('supply');
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                      {market.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium">{market.symbol}</p>
                      <p className="text-gray-400 text-sm">{market.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">{market.supplyApy}% APY</p>
                    <p className="text-gray-400 text-sm">TVL: ${market.totalSupply}</p>
                  </div>
                </div>
                {parseFloat(market.userSupplied) > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-sm text-gray-400">Tu suministro: <span className="text-white">{market.userSupplied} {market.symbol}</span></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Borrow Markets */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Mercados de Préstamo</h2>
          <div className="space-y-3">
            {MARKETS.map((market) => (
              <div
                key={market.symbol}
                className="bg-dark-200 rounded-lg p-4 hover:bg-dark-100 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedMarket(market);
                  setActionType('borrow');
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-bold">
                      {market.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium">{market.symbol}</p>
                      <p className="text-gray-400 text-sm">Colateral: {market.collateralFactor}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-bold">{market.borrowApy}% APY</p>
                    <p className="text-gray-400 text-sm">Disponible: ${market.totalSupply}</p>
                  </div>
                </div>
                {parseFloat(market.userBorrowed) > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-sm text-gray-400">Tu deuda: <span className="text-white">{market.userBorrowed} {market.symbol}</span></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {selectedMarket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedMarket.symbol}</h3>
              <button
                onClick={() => setSelectedMarket(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Action Tabs */}
            <div className="grid grid-cols-4 gap-1 mb-4 bg-dark-200 p-1 rounded-lg">
              {['supply', 'withdraw', 'borrow', 'repay'].map((action) => (
                <button
                  key={action}
                  onClick={() => setActionType(action)}
                  className={`py-2 text-sm rounded-md capitalize ${actionType === action ? 'bg-primary-500' : ''}`}
                >
                  {action === 'supply' ? 'Depositar' : action === 'withdraw' ? 'Retirar' : action === 'borrow' ? 'Pedir' : 'Pagar'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Cantidad</label>
                <div className="flex space-x-2 mt-1">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="input-field flex-1"
                  />
                  <button className="btn-secondary text-sm">MAX</button>
                </div>
              </div>

              <div className="bg-dark-200 rounded-lg p-3 space-y-2">
                {actionType === 'supply' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">APY de Suministro</span>
                      <span className="text-green-400">{selectedMarket.supplyApy}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Factor de Colateral</span>
                      <span>{selectedMarket.collateralFactor}%</span>
                    </div>
                  </>
                )}
                {actionType === 'borrow' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">APY de Préstamo</span>
                      <span className="text-red-400">{selectedMarket.borrowApy}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Nuevo Factor de Salud</span>
                      <span className="text-yellow-400">~1.85</span>
                    </div>
                  </>
                )}
              </div>

              <button className="btn-primary w-full capitalize">
                {actionType === 'supply' ? 'Depositar' : actionType === 'withdraw' ? 'Retirar' : actionType === 'borrow' ? 'Pedir Prestado' : 'Pagar Deuda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Lending;
