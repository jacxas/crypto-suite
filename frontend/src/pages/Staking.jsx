import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useStaking } from '../hooks/useStaking';
import { FiTrendingUp, FiClock, FiGift } from 'react-icons/fi';

function Staking() {
  const { address, isConnected } = useAccount();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  const {
    stakeInfo,
    totalStaked,
    rewardRate,
    tokenBalance,
    allowance,
    isApproving,
    isStaking,
    isUnstaking,
    isClaiming,
    handleApprove,
    handleStake,
    handleUnstake,
    handleClaimRewards,
  } = useStaking(address);

  const needsApproval = parseFloat(allowance) < parseFloat(stakeAmount || '0');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="text-2xl font-bold mb-2">Conecta tu Wallet</h2>
        <p className="text-gray-400">Necesitas conectar tu wallet para hacer staking</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Staking</h1>
        <p className="text-gray-400 mt-1">
          Deposita tus tokens y gana recompensas automáticas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Staked</p>
              <p className="text-xl font-bold">{totalStaked} CSUITE</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FiGift className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">APR</p>
              <p className="text-xl font-bold">{rewardRate}% diario</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FiClock className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Tu Balance</p>
              <p className="text-xl font-bold">{parseFloat(tokenBalance).toFixed(4)} CSUITE</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stake Card */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Stake Tokens</h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Cantidad a stakear</label>
              <div className="flex space-x-2 mt-1">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.0"
                  className="input-field flex-1"
                />
                <button
                  onClick={() => setStakeAmount(tokenBalance)}
                  className="btn-secondary text-sm"
                >
                  MAX
                </button>
              </div>
            </div>
            {needsApproval ? (
              <button
                onClick={() => handleApprove(stakeAmount)}
                disabled={isApproving || !stakeAmount}
                className="btn-primary w-full"
              >
                {isApproving ? 'Aprobando...' : 'Aprobar Tokens'}
              </button>
            ) : (
              <button
                onClick={() => handleStake(stakeAmount)}
                disabled={isStaking || !stakeAmount}
                className="btn-primary w-full"
              >
                {isStaking ? 'Staking...' : 'Stake'}
              </button>
            )}
          </div>
        </div>

        {/* Unstake Card */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Unstake Tokens</h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Cantidad a retirar</label>
              <div className="flex space-x-2 mt-1">
                <input
                  type="number"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  placeholder="0.0"
                  className="input-field flex-1"
                />
                <button
                  onClick={() => setUnstakeAmount(stakeInfo?.amount || '0')}
                  className="btn-secondary text-sm"
                >
                  MAX
                </button>
              </div>
            </div>
            <button
              onClick={() => handleUnstake(unstakeAmount)}
              disabled={isUnstaking || !unstakeAmount || !stakeInfo?.active}
              className="btn-primary w-full"
            >
              {isUnstaking ? 'Retirando...' : 'Unstake'}
            </button>
          </div>
        </div>
      </div>

      {/* Your Stake Info */}
      {stakeInfo?.active && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Tu Stake</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-dark-200 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Cantidad Stakeada</p>
              <p className="text-2xl font-bold">{stakeInfo.amount} CSUITE</p>
            </div>
            <div className="bg-dark-200 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Recompensas Pendientes</p>
              <p className="text-2xl font-bold text-green-400">{stakeInfo.pendingRewards} CSUITE</p>
            </div>
            <div className="bg-dark-200 rounded-lg p-4 flex items-center justify-center">
              <button
                onClick={handleClaimRewards}
                disabled={isClaiming || parseFloat(stakeInfo.pendingRewards) === 0}
                className="btn-primary"
              >
                {isClaiming ? 'Reclamando...' : 'Reclamar Recompensas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Staking;
