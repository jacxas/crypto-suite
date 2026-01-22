import { useState } from 'react';
import { useAccount } from 'wagmi';
import { FiUsers, FiCheck, FiClock, FiSend } from 'react-icons/fi';

function MultiSig() {
  const { isConnected, address } = useAccount();
  const [activeTab, setActiveTab] = useState('transactions');
  const [txForm, setTxForm] = useState({
    to: '',
    value: '',
    data: '0x',
  });

  // Mock data
  const signers = [address];
  const requiredConfirmations = 2;
  const pendingTxs = [];

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">👥</div>
        <h2 className="text-2xl font-bold mb-2">Conecta tu Wallet</h2>
        <p className="text-gray-400">Necesitas conectar tu wallet para usar MultiSig</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Multi-Signature</h1>
        <p className="text-gray-400 mt-1">
          Operaciones que requieren múltiples confirmaciones
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FiUsers className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Firmantes</p>
              <p className="text-xl font-bold">{signers.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FiCheck className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Confirmaciones Req.</p>
              <p className="text-xl font-bold">{requiredConfirmations}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <FiClock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Tx Pendientes</p>
              <p className="text-xl font-bold">{pendingTxs.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FiSend className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Tx Ejecutadas</p>
              <p className="text-xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === 'transactions'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Transacciones
        </button>
        <button
          onClick={() => setActiveTab('submit')}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === 'submit'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Nueva Transacción
        </button>
        <button
          onClick={() => setActiveTab('signers')}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === 'signers'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Firmantes
        </button>
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div>
          {pendingTxs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-400">No hay transacciones pendientes</p>
              <button
                onClick={() => setActiveTab('submit')}
                className="btn-primary mt-4"
              >
                Crear transacción
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTxs.map((tx, index) => (
                <div key={index} className="card">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">TX #{index}</p>
                      <p className="text-gray-400 text-sm truncate">To: {tx.to}</p>
                    </div>
                    <button className="btn-primary">Confirmar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Transaction Tab */}
      {activeTab === 'submit' && (
        <div className="card max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">Nueva Transacción MultiSig</h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Dirección Destino</label>
              <input
                type="text"
                value={txForm.to}
                onChange={(e) => setTxForm({ ...txForm, to: e.target.value })}
                placeholder="0x..."
                className="input-field w-full mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Valor (ETH)</label>
              <input
                type="number"
                value={txForm.value}
                onChange={(e) => setTxForm({ ...txForm, value: e.target.value })}
                placeholder="0.0"
                className="input-field w-full mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Data (hex)</label>
              <input
                type="text"
                value={txForm.data}
                onChange={(e) => setTxForm({ ...txForm, data: e.target.value })}
                placeholder="0x"
                className="input-field w-full mt-1"
              />
            </div>
            <button className="btn-primary w-full mt-6">
              Enviar Transacción
            </button>
          </div>
        </div>
      )}

      {/* Signers Tab */}
      {activeTab === 'signers' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Firmantes Autorizados</h2>
          <div className="space-y-3">
            {signers.map((signer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-dark-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <FiUsers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-mono text-sm">{signer}</p>
                    {signer === address && (
                      <span className="text-xs text-primary-400">Tú</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiSig;
