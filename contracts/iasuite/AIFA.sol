// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIFA - AI Farm Token
 * @notice Token de farming y liquidez del ecosistema
 * @dev Permite farming de tokens mediante pools de liquidez
 */
contract AIFA is ERC20, Ownable {
    uint256 private constant MAX_SUPPLY = 300_000_000 * 10**18; // 300 millones
    address public iaHub;
    
    struct FarmPool {
        uint256 id;
        string name;
        address rewardToken;
        uint256 totalStaked;
        uint256 rewardPerBlock;
        uint256 startBlock;
        uint256 endBlock;
        bool active;
    }
    
    struct UserFarm {
        uint256 staked;
        uint256 rewardDebt;
        uint256 pendingRewards;
    }
    
    mapping(uint256 => FarmPool) public farmPools;
    mapping(uint256 => mapping(address => UserFarm)) public userFarms;
    uint256 public poolCounter;
    uint256 public totalFarmed;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event FarmPoolCreated(uint256 indexed poolId, string name);
    event Farmed(address indexed user, uint256 poolId, uint256 amount);
    event Harvested(address indexed user, uint256 poolId, uint256 amount);
    event IAHubUpdated(address indexed oldHub, address indexed newHub);

    /**
     * @notice Constructor del token AIFA
     * @param initialSupply Suministro inicial del token
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(uint256 initialSupply, address initialOwner) ERC20("AI Farm", "AIFA") Ownable(initialOwner) {
        require(initialSupply <= MAX_SUPPLY, "Supply exceeds maximum");
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
            emit Minted(initialOwner, initialSupply);
        }
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
     * @notice Crea un nuevo pool de farming
     * @param name Nombre del pool
     * @param rewardToken Token de recompensa
     * @param rewardPerBlock Recompensa por bloque
     * @param durationBlocks Duración en bloques
     */
    function createFarmPool(
        string memory name,
        address rewardToken,
        uint256 rewardPerBlock,
        uint256 durationBlocks
    ) external onlyOwner {
        poolCounter++;
        farmPools[poolCounter] = FarmPool({
            id: poolCounter,
            name: name,
            rewardToken: rewardToken,
            totalStaked: 0,
            rewardPerBlock: rewardPerBlock,
            startBlock: block.number,
            endBlock: block.number + durationBlocks,
            active: true
        });
        emit FarmPoolCreated(poolCounter, name);
    }

    /**
     * @notice Realiza farming en un pool
     * @param poolId ID del pool
     * @param amount Cantidad a farmear
     */
    function farm(uint256 poolId, uint256 amount) external {
        FarmPool storage pool = farmPools[poolId];
        require(pool.active, "Pool not active");
        require(block.number >= pool.startBlock && block.number <= pool.endBlock, "Pool not active");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _harvest(poolId, msg.sender);
        
        _transfer(msg.sender, address(this), amount);
        userFarms[poolId][msg.sender].staked += amount;
        pool.totalStaked += amount;
        
        emit Farmed(msg.sender, poolId, amount);
    }

    /**
     * @notice Retira tokens del farming
     * @param poolId ID del pool
     * @param amount Cantidad a retirar
     */
    function unfarm(uint256 poolId, uint256 amount) external {
        UserFarm storage user = userFarms[poolId][msg.sender];
        require(user.staked >= amount, "Insufficient staked amount");
        
        _harvest(poolId, msg.sender);
        
        user.staked -= amount;
        farmPools[poolId].totalStaked -= amount;
        _transfer(address(this), msg.sender, amount);
    }

    /**
     * @notice Cosecha recompensas
     * @param poolId ID del pool
     */
    function harvest(uint256 poolId) external {
        _harvest(poolId, msg.sender);
    }

    /**
     * @notice Calcula recompensas pendientes
     * @param poolId ID del pool
     * @param user Dirección del usuario
     * @return uint256 Recompensas pendientes
     */
    function pendingRewards(uint256 poolId, address user) external view returns (uint256) {
        FarmPool storage pool = farmPools[poolId];
        UserFarm storage userFarm = userFarms[poolId][user];
        if (pool.totalStaked == 0) return userFarm.pendingRewards;
        uint256 blocks = block.number - pool.startBlock;
        uint256 reward = (blocks * pool.rewardPerBlock * userFarm.staked) / pool.totalStaked;
        return reward - userFarm.rewardDebt + userFarm.pendingRewards;
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
     * @notice Obtiene información de farming de un usuario
     * @param poolId ID del pool
     * @param user Dirección del usuario
     * @return staked Cantidad stakeada
     * @return pending Recompensas pendientes
     */
    function getUserFarmInfo(uint256 poolId, address user) external view returns (uint256 staked, uint256 pending) {
        return (userFarms[poolId][user].staked, userFarms[poolId][user].pendingRewards);
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
     * @dev Permite a los usuarios recuperar sus tokens farmeados en caso de emergencia
     * @param poolId ID del pool
     */
    function emergencyWithdraw(uint256 poolId) external {
        UserFarm storage userFarm = userFarms[poolId][msg.sender];
        require(userFarm.staked > 0, "No staked amount");
        uint256 amount = userFarm.staked;
        userFarm.staked = 0;
        userFarm.pendingRewards = 0;
        farmPools[poolId].totalStaked -= amount;
        _transfer(address(this), msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function _harvest(uint256 poolId, address user) internal {
        FarmPool storage pool = farmPools[poolId];
        UserFarm storage userFarm = userFarms[poolId][user];
        if (pool.totalStaked > 0) {
            uint256 blocks = block.number - pool.startBlock;
            uint256 reward = (blocks * pool.rewardPerBlock * userFarm.staked) / pool.totalStaked;
            uint256 pending = reward - userFarm.rewardDebt;
            userFarm.pendingRewards += pending;
            totalFarmed += pending;
            userFarm.rewardDebt = reward;
        }
        if (userFarm.pendingRewards > 0) {
            uint256 rewards = userFarm.pendingRewards;
            userFarm.pendingRewards = 0;
            emit Harvested(user, poolId, rewards);
        }
    }
}
