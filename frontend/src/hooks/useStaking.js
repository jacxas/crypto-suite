import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { MultiContractABI } from '../contracts/MultiContractABI';
import { ERC20ABI } from '../contracts/ERC20ABI';
import { CONTRACT_ADDRESSES } from '../config/wagmi';
import toast from 'react-hot-toast';

const CHAIN_ID = 31337; // localhost
const addresses = CONTRACT_ADDRESSES.localhost;

export function useStaking(userAddress) {
  // Read stake info
  const { data: stakeInfo, refetch: refetchStakeInfo } = useReadContract({
    address: addresses.multiContract,
    abi: MultiContractABI,
    functionName: 'getStakeInfo',
    args: [userAddress],
    enabled: !!userAddress,
  });

  // Read total staked
  const { data: totalStaked } = useReadContract({
    address: addresses.multiContract,
    abi: MultiContractABI,
    functionName: 'totalStaked',
  });

  // Read reward rate
  const { data: rewardRate } = useReadContract({
    address: addresses.multiContract,
    abi: MultiContractABI,
    functionName: 'rewardRate',
  });

  // Read token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: addresses.token,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: [userAddress],
    enabled: !!userAddress,
  });

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: addresses.token,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [userAddress, addresses.multiContract],
    enabled: !!userAddress,
  });

  // Write functions
  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: stake, data: stakeHash } = useWriteContract();
  const { writeContract: unstake, data: unstakeHash } = useWriteContract();
  const { writeContract: claimRewards, data: claimHash } = useWriteContract();

  // Wait for transactions
  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: approveHash,
    onSuccess: () => {
      toast.success('Approval successful!');
      refetchAllowance();
    },
  });

  const { isLoading: isStaking } = useWaitForTransactionReceipt({
    hash: stakeHash,
    onSuccess: () => {
      toast.success('Staking successful!');
      refetchStakeInfo();
      refetchBalance();
    },
  });

  const { isLoading: isUnstaking } = useWaitForTransactionReceipt({
    hash: unstakeHash,
    onSuccess: () => {
      toast.success('Unstaking successful!');
      refetchStakeInfo();
      refetchBalance();
    },
  });

  const { isLoading: isClaiming } = useWaitForTransactionReceipt({
    hash: claimHash,
    onSuccess: () => {
      toast.success('Rewards claimed!');
      refetchStakeInfo();
      refetchBalance();
    },
  });

  // Actions
  const handleApprove = async (amount) => {
    try {
      approve({
        address: addresses.token,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [addresses.multiContract, parseEther(amount)],
      });
    } catch (error) {
      toast.error('Approval failed: ' + error.message);
    }
  };

  const handleStake = async (amount) => {
    try {
      stake({
        address: addresses.multiContract,
        abi: MultiContractABI,
        functionName: 'stake',
        args: [parseEther(amount)],
      });
    } catch (error) {
      toast.error('Staking failed: ' + error.message);
    }
  };

  const handleUnstake = async (amount) => {
    try {
      unstake({
        address: addresses.multiContract,
        abi: MultiContractABI,
        functionName: 'unstake',
        args: [parseEther(amount)],
      });
    } catch (error) {
      toast.error('Unstaking failed: ' + error.message);
    }
  };

  const handleClaimRewards = async () => {
    try {
      claimRewards({
        address: addresses.multiContract,
        abi: MultiContractABI,
        functionName: 'claimRewards',
      });
    } catch (error) {
      toast.error('Claim failed: ' + error.message);
    }
  };

  return {
    // Data
    stakeInfo: stakeInfo ? {
      amount: formatEther(stakeInfo[0] || 0n),
      startTime: Number(stakeInfo[1] || 0n),
      lastClaimTime: Number(stakeInfo[2] || 0n),
      pendingRewards: formatEther(stakeInfo[3] || 0n),
      active: stakeInfo[4] || false,
    } : null,
    totalStaked: totalStaked ? formatEther(totalStaked) : '0',
    rewardRate: rewardRate ? Number(rewardRate) / 100 : 0, // Convert basis points to percentage
    tokenBalance: tokenBalance ? formatEther(tokenBalance) : '0',
    allowance: allowance ? formatEther(allowance) : '0',
    // Loading states
    isApproving,
    isStaking,
    isUnstaking,
    isClaiming,
    // Actions
    handleApprove,
    handleStake,
    handleUnstake,
    handleClaimRewards,
    // Refetch
    refetchAll: () => {
      refetchStakeInfo();
      refetchBalance();
      refetchAllowance();
    },
  };
}
