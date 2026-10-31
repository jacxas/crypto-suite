// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIWR - AI Reward Token
 * @notice Token de recompensas y staking del ecosistema
 * @dev Distribuye recompensas a participantes activos del protocolo
 */
contract AIWR is ERC20, Ownable {
    uint256 private constant MAX_SUPPLY = 200_000_000 * 10**18; // 200 millones
    address public iaHub;
    
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
        bool active;
    }
    
    mapping(address => Stake) public stakes;
    mapping(address => uint256) public totalRewards;
    uint256 public rewardRate; // Tokens por segundo
    uint256 public lastRewardTime;
    uint256 public totalStaked;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event IAHubUpdated(address indexed oldHub, address indexed newHub);

    /**
     * @notice Constructor del token AIWR
     * @param initialSupply Suministro inicial del token
     * @param initialOwner Dirección del propietario inicial
     * @param _rewardRate Tasa de recompensa por segundo
     */
    constructor(uint256 initialSupply, address initialOwner, uint256 _rewardRate) 
        ERC20("AI Reward", "AIWR") Ownable(initialOwner) 
    {
        require(initialSupply <= MAX_SUPPLY, "Supply exceeds maximum");
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
            emit Minted(initialOwner, initialSupply);
        }
        rewardRate = _rewardRate;
        lastRewardTime = block.timestamp;
    }

    /**
     * @notice Establece la dirección del IAHub
     * @param _iaHub Nueva dirección del hub central
     */
    function setIAHub(address _iaHub) external onlyOwner {
        require(_iaHub != address(0), "Invalid IAHub address");
        address oldHub = iaHub;
        iaHub = _iaHub;
        emit IAHubUpdated(oldHub, _iaHub);
    }

    /**
     * @notice Actualiza la tasa de recompensa
     * @param newRate Nueva tasa
     */
    function setRewardRate(uint256 newRate) external onlyOwner {
        _updateRewards();
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }

    /**
     * @notice Realiza staking de tokens
     * @param amount Cantidad a stakear
     */
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _updateRewards();
        
        if (stakes[msg.sender].active) {
            _claimRewards(msg.sender);
        }
        
        _transfer(msg.sender, address(this), amount);
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = block.timestamp;
        stakes[msg.sender].active = true;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Retira tokens del staking
     * @param amount Cantidad a retirar
     */
    function unstake(uint256 amount) external {
        require(stakes[msg.sender].active, "No active stake");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");
        
        _updateRewards();
        _claimRewards(msg.sender);
        
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        
        if (stakes[msg.sender].amount == 0) {
            stakes[msg.sender].active = false;
        }
        
        _transfer(address(this), msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Reclama recompensas acumuladas
     */
    function claimRewards() external {
        require(stakes[msg.sender].active, "No active stake");
        _updateRewards();
        _claimRewards(msg.sender);
    }

    /**
     * @notice Calcula recompensas pendientes
     * @param user Dirección del usuario
     * @return uint256 Recompensas pendientes
     */
    function pendingRewards(address user) external view returns (uint256) {
        if (!stakes[user].active || totalStaked == 0) return 0;
        uint256 timeElapsed = block.timestamp - lastRewardTime;
        uint256 reward = (timeElapsed * rewardRate * stakes[user].amount) / totalStaked;
        return reward - stakes[user].rewardDebt + totalRewards[user];
    }

    /**
     * @notice Mint de nuevos tokens
     * @param to Dirección receptora
     * @param amount Cantidad a mintear
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == owner() || msg.sender == iaHub, "Not authorized");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
        emit Minted(to, amount);
    }

    /**
     * @notice Quema tokens
     * @param amount Cantidad a quemar
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }

    /**
     * @notice Quema tokens de una dirección específica
     * @param from Dirección de origen
     * @param amount Cantidad a quemar
     */
    function burnFrom(address from, uint256 amount) external {
        require(msg.sender == owner() || msg.sender == iaHub, "Not authorized");
        _burn(from, amount);
        emit Burned(from, amount);
    }

    /**
     * @notice Obtiene información de staking de un usuario
     * @param user Dirección del usuario
     * @return amount Cantidad stakeada
     * @return timestamp Timestamp del staking
     * @return active Estado del staking
     */
    function getStakeInfo(address user) external view returns (uint256 amount, uint256 timestamp, bool active) {
        return (stakes[user].amount, stakes[user].timestamp, stakes[user].active);
    }

    /**
     * @notice Obtiene el suministro máximo
     * @return uint256 Suministro máximo
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }

    /**
     * @notice Retiro de emergencia sin recompensas
     * @dev Permite a los usuarios recuperar sus tokens stakeados en caso de emergencia
     */
    function emergencyWithdraw() external {
        require(stakes[msg.sender].active, "No active stake");
        uint256 amount = stakes[msg.sender].amount;
        stakes[msg.sender].amount = 0;
        stakes[msg.sender].active = false;
        totalStaked -= amount;
        _transfer(address(this), msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function _updateRewards() internal {
        if (totalStaked > 0 && block.timestamp > lastRewardTime) {
            uint256 timeElapsed = block.timestamp - lastRewardTime;
            uint256 reward = timeElapsed * rewardRate;
            uint256 mintable = MAX_SUPPLY > totalSupply() ? MAX_SUPPLY - totalSupply() : 0;
            if (reward > mintable) {
                reward = mintable;
            }
            if (reward > 0) {
                _mint(address(this), reward);
            }
            lastRewardTime = block.timestamp;
        }
    }

    function _claimRewards(address user) internal {
        uint256 pending = (block.timestamp - lastRewardTime) * rewardRate * stakes[user].amount / totalStaked;
        if (pending > 0) {
            totalRewards[user] += pending;
            stakes[user].rewardDebt += pending;
            emit RewardClaimed(user, pending);
        }
    }
}
