import { useState } from 'react';
import { useAccount } from 'wagmi';
import { FiCheckCircle, FiXCircle, FiClock, FiUsers, FiFileText, FiPlus } from 'react-icons/fi';

// Mock proposals - replace with contract calls
const PROPOSALS = [
  {
    id: 1,
    title: 'Aumentar recompensas de staking al 15%',
    description: 'Propuesta para incrementar las recompensas diarias de staking del 10% al 15% para incentivar mayor participación.',
    proposer: '0x1234...5678',
    status: 'active',
    votesFor: 125000,
    votesAgainst: 45000,
    endTime: Date.now() + 86400000 * 2,
    quorum: 100000,
  },
  {
    id: 2,
    title: 'Añadir nuevo pool ETH/DAI',
    description: 'Crear un nuevo pool de liquidez para el par ETH/DAI con incentivos de farming.',
    proposer: '0xabcd...efgh',
    status: 'passed',
    votesFor: 200000,
    votesAgainst: 30000,
    endTime: Date.now() - 86400000,
    quorum: 100000,
  },
  {
    id: 3,
    title: 'Reducir fee de transacción al 0.2%',
    description: 'Reducir el fee de swap del 0.3% al 0.2% para ser más competitivos.',
    proposer: '0x9876...5432',
    status: 'rejected',
    votesFor: 50000,
    votesAgainst: 150000,
    endTime: Date.now() - 86400000 * 3,
    quorum: 100000,
  },
];

function Governance() {
  const { isConnected } = useAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [newProposal, setNewProposal] = useState({ title: '', description: '' });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Activa</span>;
      case 'passed':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Aprobada</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Rechazada</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pendiente</span>;
      default:
        return null;
    }
  };

  const formatTimeRemaining = (endTime) => {
    const diff = endTime - Date.now();
    if (diff <= 0) return 'Finalizada';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return `${days}d ${hours}h restantes`;
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🏛️</div>
        <h2 className="text-2xl font-bold mb-2">Conecta tu Wallet</h2>
        <p className="text-gray-400">Necesitas conectar tu wallet para participar en la gobernanza</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Gobernanza DAO</h1>
          <p className="text-gray-400 mt-1">
            Participa en las decisiones del protocolo votando propuestas
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus /> <span>Nueva Propuesta</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FiFileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Propuestas Totales</p>
              <p className="text-xl font-bold">{PROPOSALS.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FiCheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Aprobadas</p>
              <p className="text-xl font-bold">{PROPOSALS.filter(p => p.status === 'passed').length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FiUsers className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Tu Poder de Voto</p>
              <p className="text-xl font-bold">0 CSUITE</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <FiClock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Activas</p>
              <p className="text-xl font-bold">{PROPOSALS.filter(p => p.status === 'active').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Propuestas</h2>
        {PROPOSALS.map((proposal) => (
          <div
            key={proposal.id}
            className="card hover:border-primary-500 cursor-pointer transition-colors"
            onClick={() => setSelectedProposal(proposal)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold">{proposal.title}</h3>
                  {getStatusBadge(proposal.status)}
                </div>
                <p className="text-gray-400 text-sm">Propuesto por {proposal.proposer}</p>
              </div>
              <div className="text-right text-sm text-gray-400">
                <FiClock className="inline mr-1" />
                {formatTimeRemaining(proposal.endTime)}
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">{proposal.description}</p>
            
            {/* Voting Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-400">A favor: {(proposal.votesFor / 1000).toFixed(0)}K</span>
                <span className="text-red-400">En contra: {(proposal.votesAgainst / 1000).toFixed(0)}K</span>
              </div>
              <div className="h-2 bg-dark-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400"
                  style={{ width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-400">
                Quórum: {((proposal.votesFor + proposal.votesAgainst) / proposal.quorum * 100).toFixed(0)}% alcanzado
              </div>
            </div>

            {proposal.status === 'active' && (
              <div className="flex space-x-3 mt-4">
                <button className="btn-primary flex-1 flex items-center justify-center space-x-2">
                  <FiCheckCircle /> <span>Votar a Favor</span>
                </button>
                <button className="btn-secondary flex-1 flex items-center justify-center space-x-2">
                  <FiXCircle /> <span>Votar en Contra</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Nueva Propuesta</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Título</label>
                <input
                  type="text"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                  placeholder="Título de la propuesta"
                  className="input-field w-full mt-1"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Descripción</label>
                <textarea
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                  placeholder="Describe tu propuesta en detalle..."
                  rows={4}
                  className="input-field w-full mt-1 resize-none"
                />
              </div>
              <div className="bg-dark-200 rounded-lg p-3 text-sm">
                <p className="text-gray-400">Requisitos:</p>
                <ul className="text-gray-300 mt-1 space-y-1">
                  <li>• Mínimo 1,000 CSUITE para crear propuesta</li>
                  <li>• Período de votación: 3 días</li>
                  <li>• Quórum requerido: 100,000 CSUITE</li>
                </ul>
              </div>
              <button className="btn-primary w-full">Crear Propuesta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Governance;
