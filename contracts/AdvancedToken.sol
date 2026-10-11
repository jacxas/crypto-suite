// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AdvancedToken
 * @dev ERC20 con comision de transferencia, staking, recompensas y auto-compound.
 * @notice Implementado segun la especificacion de test/AdvancedToken.test.cjs e
 *         Integration.test.cjs.
 */
contract AdvancedToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    /// @dev Estado de staking expuesto como `stakes(address)` (lo consulta la spec).
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        bool autoCompound;
    }

    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public stakingTimestamp;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => StakeInfo) public stakes;

    uint256 public totalStaked;
    uint256 public rewardPool;
    uint256 public constant FEE_PERCENT = 1;

    /// @dev Por defecto 0: la especificacion exige poder retirar el stake de
    ///      inmediato. El minimo es opt-in con `setMinStakeDuration`.
    uint256 public minStakeDuration = 0;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event AutoCompounded(uint256 amount);
    event AutoCompoundSet(address indexed user, bool enabled);
    event RewardsClaimed(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Transfiere tokens aplicando la comision del 1%.
    /// @dev El emisor se debita el importe COMPLETO: la comision se mueve
    ///      tambien desde su saldo y queda en el contrato respaldando rewardPool.
    function transfer(
        address recipient,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        uint256 fee = (amount * FEE_PERCENT) / 100;
        uint256 netAmount = amount - fee;

        _transfer(_msgSender(), recipient, netAmount);

        if (fee > 0) {
            _transfer(_msgSender(), address(this), fee);
            rewardPool += fee;
        }
        return true;
    }

    // ======================= Staking =======================

    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        if (stakingBalance[msg.sender] > 0) {
            _claimRewards(msg.sender);
        }

        _transfer(msg.sender, address(this), amount);
        stakingBalance[msg.sender] += amount;
        totalStaked += amount;
        stakingTimestamp[msg.sender] = block.timestamp;
        lastClaimTime[msg.sender] = block.timestamp;

        StakeInfo storage info = stakes[msg.sender];
        info.amount = stakingBalance[msg.sender];
        info.startTime = block.timestamp;
        info.lastClaimTime = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(stakingBalance[msg.sender] >= amount, "Insufficient staked balance");
        require(
            block.timestamp >= stakingTimestamp[msg.sender] + minStakeDuration,
            "Min stake duration not met"
        );

        _claimRewards(msg.sender);

        stakingBalance[msg.sender] -= amount;
        totalStaked -= amount;
        stakes[msg.sender].amount = stakingBalance[msg.sender];

        _transfer(address(this), msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        require(stakingBalance[msg.sender] > 0, "No staked balance");
        _claimRewards(msg.sender);
    }

    /// @dev El tope a `rewardPool` es necesario: `calculateRewards` puede superar
    ///      el bote (sobre todo cuando parte del stake ya se retiro) y entonces
    ///      el premio simplemente no se pagaba nunca.
    function _claimRewards(address user) internal {
        uint256 rewards = calculateRewards(user);
        if (rewards > rewardPool) {
            rewards = rewardPool;
        }
        if (rewards > 0) {
            rewardPool -= rewards;
            lastClaimTime[user] = block.timestamp;
            stakes[user].lastClaimTime = block.timestamp;
            _transfer(address(this), user, rewards);
            emit RewardsClaimed(user, rewards);
        }
    }

    /// @dev Las recompensas se devengan por DIAS COMPLETOS. Asi un unstake
    ///      inmediato no genera premio y devuelve exactamente lo depositado,
    ///      que es lo que exige test/AdvancedToken.test.cjs.
    function calculateRewards(address user) public view returns (uint256) {
        if (stakingBalance[user] == 0 || totalStaked == 0) return 0;
        uint256 timeStaked = block.timestamp - lastClaimTime[user];

        uint256 fullDays = timeStaked / 1 days;
        if (fullDays == 0) return 0;
        uint256 accruedTime = fullDays * 1 days;

        uint256 baseReward = (stakingBalance[user] * accruedTime * 1) / (100 * 1 days);
        uint256 poolShare = (stakingBalance[user] * rewardPool) / totalStaked;
        return baseReward + poolShare;
    }

    // ======================= Auto-compound =======================

    /// @notice Activa o desactiva el auto-compound para el que llama.
    function setAutoCompound(bool enabled) external {
        stakes[msg.sender].autoCompound = enabled;
        emit AutoCompoundSet(msg.sender, enabled);
    }

    /// @notice Reinvierte las recompensas pendientes dentro del propio stake.
    function compound() external nonReentrant {
        require(stakes[msg.sender].autoCompound, "Auto-compound not enabled");

        uint256 rewards = calculateRewards(msg.sender);
        if (rewards > rewardPool) {
            rewards = rewardPool;
        }

        if (rewards > 0) {
            rewardPool -= rewards;
            stakingBalance[msg.sender] += rewards;
            totalStaked += rewards;
            lastClaimTime[msg.sender] = block.timestamp;
            emit RewardsClaimed(msg.sender, rewards);
        }

        StakeInfo storage info = stakes[msg.sender];
        info.amount = stakingBalance[msg.sender];
        info.lastClaimTime = block.timestamp;

        emit AutoCompounded(rewards);
    }

    /// @notice Compone la mitad del bote a favor del protocolo (solo owner).
    function autoCompound() external onlyOwner nonReentrant {
        require(rewardPool > 0, "No rewards to compound");
        uint256 compoundAmount = rewardPool / 2;
        rewardPool -= compoundAmount;
        totalStaked += compoundAmount;
        emit AutoCompounded(compoundAmount);
    }

    // ======================= Administracion =======================

    function emergencyWithdraw() external nonReentrant {
        uint256 amount = stakingBalance[msg.sender];
        require(amount > 0, "No staked balance");
        stakingBalance[msg.sender] = 0;
        stakes[msg.sender].amount = 0;
        totalStaked -= amount;
        _transfer(address(this), msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, amount);
    }

    function setMinStakeDuration(uint256 _duration) external onlyOwner {
        minStakeDuration = _duration;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
