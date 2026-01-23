// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IMiningProtocol
 * @dev Interface para conectar con protocolos de yield/minería externos
 */
interface IMiningProtocol {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function claimRewards() external returns (uint256);
    function pendingRewards(address user) external view returns (uint256);
    function getAPY() external view returns (uint256);
}

/**
 * @title ISwapRouter
 * @dev Interface simplificada para swaps (Uniswap/Sushiswap style)
 */
interface ISwapRouter {
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

/**
 * @title MinerToken
 * @dev Token ERC20 con capacidades de minería multi-protocolo
 * 
 * Características principales:
 * - Atributos de minería: poder, nivel IA, protocolo objetivo
 * - Auto-acumulación de gas (porcentaje configurable)
 * - Soporte multi-protocolo (Aave, Compound, Lido, Yearn, etc.)
 * - Sistema de compound automático
 * - Distribución de recompensas
 */
contract MinerToken is ERC20, ERC20Burnable, Pausable, ReentrancyGuard, Ownable {
    
    // ============ ESTRUCTURAS ============
    
    /**
     * @dev Atributos de minería para cada holder
     */
    struct MiningAttributes {
        uint256 miningPower;        // Poder de minería (1-100)
        uint256 aiLevel;            // Nivel de IA (1-10)
        address activeProtocol;     // Protocolo donde está minando
        uint256 stakedAmount;       // Cantidad en staking
        uint256 lastClaimBlock;     // Último bloque donde reclamó
        uint256 totalMined;         // Total minado históricamente
        uint256 gasReserve;         // Reserva personal de gas (en wei)
    }
    
    /**
     * @dev Información de protocolo soportado
     */
    struct ProtocolInfo {
        bool isActive;              // Si está activo
        string name;                // Nombre del protocolo
        address rewardToken;        // Token de recompensa
        uint256 totalDeposited;     // Total depositado en este protocolo
        uint256 minDeposit;         // Depósito mínimo
        uint256 riskLevel;          // Nivel de riesgo (1-10)
    }
    
    // ============ VARIABLES DE ESTADO ============
    
    // Mapeos principales
    mapping(address => MiningAttributes) public minerAttributes;
    mapping(address => ProtocolInfo) public supportedProtocols;
    address[] public protocolList;
    
    // Configuración de gas
    uint256 public gasReservePercentage = 10;  // 10% de rewards para gas
    uint256 public totalGasReserve;            // Reserva total de gas del contrato
    uint256 public minGasThreshold = 0.01 ether; // Mínimo para operaciones
    
    // Estadísticas globales
    uint256 public totalMinedAllTime;
    uint256 public totalActiveMiners;
    uint256 public totalStakedValue;
    
    // Configuración de minería
    uint256 public baseRewardRate = 100;       // Tasa base de recompensa
    uint256 public aiBoostMultiplier = 150;    // 1.5x boost por nivel IA máximo
    
    // Router para swaps (configurable)
    ISwapRouter public swapRouter;
    address public wrappedNative;              // WETH/WMATIC según la red
    
    // ============ EVENTOS ============
    
    event MiningStarted(address indexed miner, address indexed protocol, uint256 amount);
    event MiningStopped(address indexed miner, address indexed protocol, uint256 amount);
    event RewardsClaimed(address indexed miner, uint256 rewardAmount, uint256 gasReserved);
    event GasReserved(address indexed miner, uint256 amount);
    event GasUsed(address indexed miner, uint256 amount, string operation);
    event ProtocolAdded(address indexed protocol, string name);
    event ProtocolRemoved(address indexed protocol);
    event AttributesUpgraded(address indexed miner, uint256 newPower, uint256 newAiLevel);
    event AutoCompounded(address indexed miner, uint256 amount);
    event EmergencyWithdraw(address indexed miner, uint256 amount);
    
    // ============ MODIFICADORES ============
    
    modifier onlyActiveMiner() {
        require(minerAttributes[msg.sender].stakedAmount > 0, "Not an active miner");
        _;
    }
    
    modifier validProtocol(address protocol) {
        require(supportedProtocols[protocol].isActive, "Protocol not supported");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor del MinerToken
     * @param _name Nombre del token
     * @param _symbol Símbolo del token
     * @param _initialSupply Supply inicial
     * @param _swapRouter Dirección del router de swap
     * @param _wrappedNative Dirección de WETH/WMATIC
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _swapRouter,
        address _wrappedNative
    ) ERC20(_name, _symbol) {
        _mint(msg.sender, _initialSupply);
        swapRouter = ISwapRouter(_swapRouter);
        wrappedNative = _wrappedNative;
    }
    
    // ============ FUNCIONES DE MINERÍA ============
    
    /**
     * @dev Inicia minería en un protocolo específico
     * @param protocol Dirección del protocolo
     * @param amount Cantidad a depositar
     */
    function startMining(address protocol, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        validProtocol(protocol) 
    {
        require(amount >= supportedProtocols[protocol].minDeposit, "Below minimum deposit");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Transferir tokens al contrato
        _transfer(msg.sender, address(this), amount);
        
        // Inicializar atributos si es nuevo minero
        if (minerAttributes[msg.sender].miningPower == 0) {
            minerAttributes[msg.sender].miningPower = 10; // Poder inicial
            minerAttributes[msg.sender].aiLevel = 1;      // Nivel IA inicial
            totalActiveMiners++;
        }
        
        // Actualizar atributos del minero
        minerAttributes[msg.sender].activeProtocol = protocol;
        minerAttributes[msg.sender].stakedAmount += amount;
        minerAttributes[msg.sender].lastClaimBlock = block.number;
        
        // Actualizar estadísticas del protocolo
        supportedProtocols[protocol].totalDeposited += amount;
        totalStakedValue += amount;
        
        // Depositar en el protocolo externo
        _approve(address(this), protocol, amount);
        IMiningProtocol(protocol).deposit(amount);
        
        emit MiningStarted(msg.sender, protocol, amount);
    }
    
    /**
     * @dev Detiene la minería y retira fondos
     * @param amount Cantidad a retirar
     */
    function stopMining(uint256 amount) 
        external 
        nonReentrant 
        onlyActiveMiner 
    {
        MiningAttributes storage attrs = minerAttributes[msg.sender];
        require(amount <= attrs.stakedAmount, "Exceeds staked amount");
        
        address protocol = attrs.activeProtocol;
        
        // Primero reclamar recompensas pendientes
        _claimRewardsInternal(msg.sender);
        
        // Retirar del protocolo externo
        IMiningProtocol(protocol).withdraw(amount);
        
        // Actualizar estado
        attrs.stakedAmount -= amount;
        supportedProtocols[protocol].totalDeposited -= amount;
        totalStakedValue -= amount;
        
        // Si ya no tiene nada stakeado, limpiar protocolo activo
        if (attrs.stakedAmount == 0) {
            attrs.activeProtocol = address(0);
            totalActiveMiners--;
        }
        
        // Devolver tokens al usuario
        _transfer(address(this), msg.sender, amount);
        
        emit MiningStopped(msg.sender, protocol, amount);
    }
    
    /**
     * @dev Reclama recompensas de minería
     */
    function claimRewards() external nonReentrant onlyActiveMiner {
        _claimRewardsInternal(msg.sender);
    }
    
    /**
     * @dev Lógica interna de reclamación de recompensas
     */
    function _claimRewardsInternal(address miner) internal {
        MiningAttributes storage attrs = minerAttributes[miner];
        address protocol = attrs.activeProtocol;
        
        if (protocol == address(0)) return;
        
        // Calcular recompensas del protocolo
        uint256 protocolRewards = IMiningProtocol(protocol).claimRewards();
        
        // Calcular bonus por atributos
        uint256 powerBonus = (protocolRewards * attrs.miningPower) / 100;
        uint256 aiBonus = (protocolRewards * attrs.aiLevel * aiBoostMultiplier) / 1000;
        uint256 totalRewards = protocolRewards + powerBonus + aiBonus;
        
        // Reservar porcentaje para gas
        uint256 gasAmount = (totalRewards * gasReservePercentage) / 100;
        uint256 netRewards = totalRewards - gasAmount;
        
        // Actualizar reservas de gas
        attrs.gasReserve += gasAmount;
        totalGasReserve += gasAmount;
        
        // Actualizar estadísticas
        attrs.totalMined += netRewards;
        attrs.lastClaimBlock = block.number;
        totalMinedAllTime += netRewards;
        
        // Mintear recompensas al minero
        if (netRewards > 0) {
            _mint(miner, netRewards);
        }
        
        emit RewardsClaimed(miner, netRewards, gasAmount);
        emit GasReserved(miner, gasAmount);
    }
    
    /**
     * @dev Auto-compound: reinvierte recompensas automáticamente
     */
    function autoCompound() external nonReentrant onlyActiveMiner {
        MiningAttributes storage attrs = minerAttributes[msg.sender];
        
        // Reclamar primero
        _claimRewardsInternal(msg.sender);
        
        // Obtener balance disponible (excluyendo lo ya stakeado)
        uint256 availableBalance = balanceOf(msg.sender);
        require(availableBalance > 0, "Nothing to compound");
        
        address protocol = attrs.activeProtocol;
        require(protocol != address(0), "No active protocol");
        
        // Transferir y depositar
        _transfer(msg.sender, address(this), availableBalance);
        _approve(address(this), protocol, availableBalance);
        IMiningProtocol(protocol).deposit(availableBalance);
        
        // Actualizar estado
        attrs.stakedAmount += availableBalance;
        supportedProtocols[protocol].totalDeposited += availableBalance;
        totalStakedValue += availableBalance;
        
        emit AutoCompounded(msg.sender, availableBalance);
    }
    
    // ============ FUNCIONES DE GAS ============
    
    /**
     * @dev Convierte reserva de gas a ETH nativo
     * @param amount Cantidad de tokens a convertir
     */
    function convertGasToNative(uint256 amount) external nonReentrant {
        MiningAttributes storage attrs = minerAttributes[msg.sender];
        require(attrs.gasReserve >= amount, "Insufficient gas reserve");
        
        attrs.gasReserve -= amount;
        totalGasReserve -= amount;
        
        // Preparar path para swap
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = wrappedNative;
        
        // Aprobar y ejecutar swap
        _approve(address(this), address(swapRouter), amount);
        swapRouter.swapExactTokensForETH(
            amount,
            0, // Aceptar cualquier cantidad (en producción usar slippage)
            path,
            msg.sender,
            block.timestamp + 300
        );
        
        emit GasUsed(msg.sender, amount, "convertToNative");
    }
    
    /**
     * @dev Usa gas reserve para pagar una operación
     * @param amount Cantidad a usar
     * @param operation Descripción de la operación
     */
    function useGasReserve(uint256 amount, string calldata operation) 
        external 
        onlyOwner 
    {
        require(totalGasReserve >= amount, "Insufficient total gas reserve");
        totalGasReserve -= amount;
        
        emit GasUsed(address(this), amount, operation);
    }
    
    // ============ FUNCIONES DE ATRIBUTOS ============
    
    /**
     * @dev Mejora los atributos de minería (requiere quemar tokens)
     * @param powerIncrease Incremento de poder de minería
     * @param aiIncrease Incremento de nivel IA
     */
    function upgradeAttributes(uint256 powerIncrease, uint256 aiIncrease) 
        external 
        nonReentrant 
    {
        MiningAttributes storage attrs = minerAttributes[msg.sender];
        
        // Calcular costo (más caro a mayor nivel)
        uint256 powerCost = powerIncrease * (attrs.miningPower + 1) * 10 ** decimals();
        uint256 aiCost = aiIncrease * (attrs.aiLevel + 1) * 50 * 10 ** decimals();
        uint256 totalCost = powerCost + aiCost;
        
        require(balanceOf(msg.sender) >= totalCost, "Insufficient balance for upgrade");
        
        // Quemar tokens como costo
        _burn(msg.sender, totalCost);
        
        // Aplicar mejoras (con límites)
        attrs.miningPower = _min(attrs.miningPower + powerIncrease, 100);
        attrs.aiLevel = _min(attrs.aiLevel + aiIncrease, 10);
        
        emit AttributesUpgraded(msg.sender, attrs.miningPower, attrs.aiLevel);
    }
    
    // ============ FUNCIONES DE ADMINISTRACIÓN ============
    
    /**
     * @dev Agrega un nuevo protocolo soportado
     */
    function addProtocol(
        address protocol,
        string calldata name,
        address rewardToken,
        uint256 minDeposit,
        uint256 riskLevel
    ) external onlyOwner {
        require(!supportedProtocols[protocol].isActive, "Protocol already exists");
        
        supportedProtocols[protocol] = ProtocolInfo({
            isActive: true,
            name: name,
            rewardToken: rewardToken,
            totalDeposited: 0,
            minDeposit: minDeposit,
            riskLevel: riskLevel
        });
        
        protocolList.push(protocol);
        
        emit ProtocolAdded(protocol, name);
    }
    
    /**
     * @dev Desactiva un protocolo
     */
    function removeProtocol(address protocol) external onlyOwner {
        require(supportedProtocols[protocol].isActive, "Protocol not active");
        supportedProtocols[protocol].isActive = false;
        
        emit ProtocolRemoved(protocol);
    }
    
    /**
     * @dev Actualiza el porcentaje de reserva de gas
     */
    function setGasReservePercentage(uint256 newPercentage) external onlyOwner {
        require(newPercentage <= 30, "Max 30%");
        gasReservePercentage = newPercentage;
    }
    
    /**
     * @dev Actualiza el router de swap
     */
    function setSwapRouter(address newRouter) external onlyOwner {
        swapRouter = ISwapRouter(newRouter);
    }
    
    /**
     * @dev Pausa el contrato
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Reanuda el contrato
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ FUNCIONES DE EMERGENCIA ============
    
    /**
     * @dev Retiro de emergencia (sin recompensas)
     */
    function emergencyWithdraw() external nonReentrant {
        MiningAttributes storage attrs = minerAttributes[msg.sender];
        uint256 amount = attrs.stakedAmount;
        require(amount > 0, "Nothing to withdraw");
        
        address protocol = attrs.activeProtocol;
        
        // Retirar del protocolo
        IMiningProtocol(protocol).withdraw(amount);
        
        // Limpiar estado
        supportedProtocols[protocol].totalDeposited -= amount;
        totalStakedValue -= amount;
        attrs.stakedAmount = 0;
        attrs.activeProtocol = address(0);
        totalActiveMiners--;
        
        // Devolver tokens
        _transfer(address(this), msg.sender, amount);
        
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    // ============ FUNCIONES DE VISTA ============
    
    /**
     * @dev Obtiene las recompensas pendientes de un minero
     */
    function pendingRewards(address miner) external view returns (uint256) {
        MiningAttributes memory attrs = minerAttributes[miner];
        if (attrs.activeProtocol == address(0)) return 0;
        
        uint256 protocolRewards = IMiningProtocol(attrs.activeProtocol).pendingRewards(address(this));
        uint256 userShare = (protocolRewards * attrs.stakedAmount) / supportedProtocols[attrs.activeProtocol].totalDeposited;
        
        // Aplicar bonuses
        uint256 powerBonus = (userShare * attrs.miningPower) / 100;
        uint256 aiBonus = (userShare * attrs.aiLevel * aiBoostMultiplier) / 1000;
        
        return userShare + powerBonus + aiBonus;
    }
    
    /**
     * @dev Obtiene información completa de un minero
     */
    function getMinerInfo(address miner) external view returns (
        uint256 miningPower,
        uint256 aiLevel,
        address activeProtocol,
        uint256 stakedAmount,
        uint256 totalMined,
        uint256 gasReserve
    ) {
        MiningAttributes memory attrs = minerAttributes[miner];
        return (
            attrs.miningPower,
            attrs.aiLevel,
            attrs.activeProtocol,
            attrs.stakedAmount,
            attrs.totalMined,
            attrs.gasReserve
        );
    }
    
    /**
     * @dev Obtiene lista de protocolos soportados
     */
    function getProtocolCount() external view returns (uint256) {
        return protocolList.length;
    }
    
    /**
     * @dev Obtiene estadísticas globales
     */
    function getGlobalStats() external view returns (
        uint256 _totalMinedAllTime,
        uint256 _totalActiveMiners,
        uint256 _totalStakedValue,
        uint256 _totalGasReserve
    ) {
        return (totalMinedAllTime, totalActiveMiners, totalStakedValue, totalGasReserve);
    }
    
    // ============ FUNCIONES INTERNAS ============
    
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    /**
     * @dev Hook antes de transferencias
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Permite recibir ETH
     */
    receive() external payable {}
}
