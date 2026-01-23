import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// ABI simplificado del Faucet
const FAUCET_ABI = [
  {
    "inputs": [],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "referrer", "type": "address" }],
    "name": "claimWithReferral",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getUserInfo",
    "outputs": [
      { "name": "totalClaimed", "type": "uint256" },
      { "name": "lastClaimTime", "type": "uint256" },
      { "name": "streak", "type": "uint256" },
      { "name": "tier", "type": "uint8" },
      { "name": "referralCount", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "canClaim",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getClaimAmount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimCooldown",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Dirección del contrato Faucet (actualizar después del deploy)
const FAUCET_ADDRESS = '0x0000000000000000000000000000000000000000';

const TIERS = [
  { name: 'Bronce', color: 'text-amber-600', bg: 'bg-amber-600/20', bonus: '0%', icon: '🥉' },
  { name: 'Plata', color: 'text-gray-400', bg: 'bg-gray-400/20', bonus: '+25%', icon: '🥈' },
  { name: 'Oro', color: 'text-yellow-500', bg: 'bg-yellow-500/20', bonus: '+50%', icon: '🥇' },
  { name: 'Platino', color: 'text-cyan-400', bg: 'bg-cyan-400/20', bonus: '+100%', icon: '💎' },
  { name: 'Diamante', color: 'text-purple-500', bg: 'bg-purple-500/20', bonus: '+200%', icon: '👑' },
];

const QUESTS = [
  { id: 1, name: 'Primer Claim', description: 'Reclama tokens por primera vez', reward: '50 CSUITE', icon: '🎯', completed: false },
  { id: 2, name: 'Racha de 7 días', description: 'Reclama 7 días consecutivos', reward: '200 CSUITE', icon: '🔥', completed: false },
  { id: 3, name: 'Referir amigo', description: 'Invita a un amigo usando tu link', reward: '100 CSUITE', icon: '👥', completed: false },
  { id: 4, name: 'Seguir en Twitter', description: 'Sigue @CryptoSuite en Twitter', reward: '25 CSUITE', icon: '🐦', completed: false },
  { id: 5, name: 'Unirse a Discord', description: 'Únete al servidor de Discord', reward: '25 CSUITE', icon: '💬', completed: false },
  { id: 6, name: 'Hacer Stake', description: 'Haz stake de al menos 100 CSUITE', reward: '150 CSUITE', icon: '🏦', completed: false },
];

export default function Faucet() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('claim');
  const [referralCode, setReferralCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);

  // Leer información del usuario
  const { data: userInfo } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'getUserInfo',
    args: [address],
    enabled: isConnected && FAUCET_ADDRESS !== '0x0000000000000000000000000000000000000000',
  });

  // Verificar si puede reclamar
  const { data: canClaim } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'canClaim',
    args: [address],
    enabled: isConnected && FAUCET_ADDRESS !== '0x0000000000000000000000000000000000000000',
  });

  // Obtener cantidad a reclamar
  const { data: claimAmount } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'getClaimAmount',
    args: [address],
    enabled: isConnected && FAUCET_ADDRESS !== '0x0000000000000000000000000000000000000000',
  });

  // Escribir contrato
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Esperar confirmación
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Función para reclamar
  const handleClaim = () => {
    if (referralCode && referralCode.startsWith('0x')) {
      writeContract({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'claimWithReferral',
        args: [referralCode],
      });
    } else {
      writeContract({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'claim',
      });
    }
  };

  // Copiar link de referido
  const copyReferralLink = () => {
    const link = `${window.location.origin}/faucet?ref=${address}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Countdown timer
  useEffect(() => {
    if (userInfo && userInfo[1]) {
      const lastClaim = Number(userInfo[1]);
      const cooldown = 24 * 60 * 60; // 24 horas
      const nextClaim = lastClaim + cooldown;
      const now = Math.floor(Date.now() / 1000);
      
      if (nextClaim > now) {
        setCountdown(nextClaim - now);
        const interval = setInterval(() => {
          setCountdown(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [userInfo]);

  const formatCountdown = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentTier = userInfo ? TIERS[userInfo[3]] : TIERS[0];
  const streak = userInfo ? Number(userInfo[2]) : 0;
  const totalClaimed = userInfo ? formatEther(userInfo[0]) : '0';
  const referralCount = userInfo ? Number(userInfo[4]) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold gradient-text mb-2">🚰 Faucet CSUITE</h1>
        <p className="text-gray-400">Reclama tokens gratis cada 24 horas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-1">{currentTier.icon}</div>
          <div className={`text-lg font-bold ${currentTier.color}`}>{currentTier.name}</div>
          <div className="text-xs text-gray-500">Tu Tier</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-lg font-bold text-orange-500">{streak} días</div>
          <div className="text-xs text-gray-500">Racha actual</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-lg font-bold text-green-500">{totalClaimed}</div>
          <div className="text-xs text-gray-500">Total reclamado</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-lg font-bold text-blue-500">{referralCount}</div>
          <div className="text-xs text-gray-500">Referidos</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-700">
        {['claim', 'quests', 'referidos', 'tiers'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card p-6">
        {/* Claim Tab */}
        {activeTab === 'claim' && (
          <div className="text-center space-y-6">
            {!isConnected ? (
              <div className="py-8">
                <div className="text-6xl mb-4">🔗</div>
                <p className="text-gray-400 mb-4">Conecta tu billetera para reclamar tokens</p>
              </div>
            ) : FAUCET_ADDRESS === '0x0000000000000000000000000000000000000000' ? (
              <div className="py-8">
                <div className="text-6xl mb-4">🚧</div>
                <p className="text-gray-400 mb-4">El Faucet aún no está desplegado</p>
                <p className="text-sm text-gray-500">Próximamente disponible en Sepolia</p>
              </div>
            ) : (
              <>
                <div className="text-6xl">🚰</div>
                
                {/* Cantidad a reclamar */}
                <div className="bg-dark-100 rounded-xl p-6">
                  <p className="text-gray-400 mb-2">Cantidad disponible</p>
                  <p className="text-4xl font-bold gradient-text">
                    {claimAmount ? formatEther(claimAmount) : '100'} CSUITE
                  </p>
                  <div className="flex justify-center gap-2 mt-2 text-sm">
                    <span className={`${currentTier.bg} ${currentTier.color} px-2 py-1 rounded`}>
                      Tier: {currentTier.bonus}
                    </span>
                    {streak > 0 && (
                      <span className="bg-orange-500/20 text-orange-500 px-2 py-1 rounded">
                        Racha: +{streak * 5}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Input de referido */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Código de referido (opcional)</label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-dark-100 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>

                {/* Botón de claim */}
                {countdown > 0 ? (
                  <div>
                    <p className="text-gray-400 mb-2">Próximo claim disponible en:</p>
                    <p className="text-3xl font-mono text-primary-500">{formatCountdown(countdown)}</p>
                  </div>
                ) : (
                  <button
                    onClick={handleClaim}
                    disabled={isPending || isConfirming || !canClaim}
                    className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? '⏳ Confirmando...' : isConfirming ? '⛏️ Procesando...' : '🎁 Reclamar Tokens'}
                  </button>
                )}

                {isSuccess && (
                  <div className="bg-green-500/20 text-green-500 p-4 rounded-lg">
                    ✅ ¡Tokens reclamados exitosamente!
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Quests Tab */}
        {activeTab === 'quests' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">🎯 Misiones Disponibles</h3>
            {QUESTS.map((quest) => (
              <div
                key={quest.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  quest.completed
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-dark-100 border-gray-700 hover:border-primary-500'
                } transition-colors`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{quest.icon}</span>
                  <div>
                    <p className="font-medium">{quest.name}</p>
                    <p className="text-sm text-gray-400">{quest.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-primary-500 font-bold">{quest.reward}</p>
                  {quest.completed ? (
                    <span className="text-green-500 text-sm">✓ Completada</span>
                  ) : (
                    <button className="text-sm text-gray-400 hover:text-white">Completar →</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Referidos Tab */}
        {activeTab === 'referidos' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-2">Programa de Referidos</h3>
              <p className="text-gray-400">Gana 10% extra por cada amigo que invites</p>
            </div>

            <div className="bg-dark-100 rounded-xl p-6">
              <p className="text-sm text-gray-400 mb-2">Tu link de referido:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={isConnected ? `${window.location.origin}/faucet?ref=${address}` : 'Conecta tu billetera'}
                  className="flex-1 bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300"
                />
                <button
                  onClick={copyReferralLink}
                  disabled={!isConnected}
                  className="btn-primary px-4 py-2"
                >
                  {copied ? '✓ Copiado' : '📋 Copiar'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4 text-center">
                <p className="text-3xl font-bold text-blue-500">{referralCount}</p>
                <p className="text-sm text-gray-400">Amigos invitados</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-3xl font-bold text-green-500">{referralCount * 10}%</p>
                <p className="text-sm text-gray-400">Bonus acumulado</p>
              </div>
            </div>
          </div>
        )}

        {/* Tiers Tab */}
        {activeTab === 'tiers' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">🏆 Sistema de Tiers</h3>
            <p className="text-gray-400 mb-6">Sube de nivel reclamando más tokens y completando misiones</p>
            
            {TIERS.map((tier, index) => (
              <div
                key={tier.name}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  userInfo && userInfo[3] === index
                    ? `${tier.bg} border-2 border-current ${tier.color}`
                    : 'bg-dark-100 border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{tier.icon}</span>
                  <div>
                    <p className={`font-bold ${tier.color}`}>{tier.name}</p>
                    <p className="text-sm text-gray-400">
                      {index === 0 && '0 - 999 CSUITE'}
                      {index === 1 && '1,000 - 4,999 CSUITE'}
                      {index === 2 && '5,000 - 19,999 CSUITE'}
                      {index === 3 && '20,000 - 49,999 CSUITE'}
                      {index === 4 && '50,000+ CSUITE'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tier.color}`}>{tier.bonus}</p>
                  <p className="text-xs text-gray-500">Bonus por claim</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
