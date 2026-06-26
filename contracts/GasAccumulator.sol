// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ISwapRouter
 * @dev Interface para swaps
 */
interface ISwapRouter {
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    
    function getAmountsOut(uint256 amountIn, address[] calldata path) 
        external view returns (uint256[] memory amounts);
}

/**
 * @title GasAccumulator
 * @dev Contrato para acumular y gestionar reservas de gas
 * 
 * Funcionalidades:
 * - Recibe tokens de recompensa de minería
 * - Convierte automáticamente a ETH nativo
 * - Distribuye gas a mineros según necesidad
 * - Ejecuta transacciones automáticas con Chainlink/Gelato
 */
contract GasAccumulator is Ownable, ReentrancyGuard {
    
    // ============ ESTRUCTURAS ============
    
    struct GasAccount {
        uint256 balance;           // Balance en wei
        uint256 totalDeposited;    // Total depositado históricamente
        uint256 totalUsed;         // Total usado históricamente
        uint256 lastTopUp;         // Timestamp del último top-up
    }
    
    struct AutoTask {
        address owner;             // Dueño/creador de la tarea (paga el gas)
        address target;            // Contrato objetivo
        bytes data;                // Calldata de la función
        uint256 gasLimit;          // Límite de gas
        uint256 interval;          // Intervalo en segundos
        uint256 lastExecution;     // Última ejecución
        bool isActive;             // Si está activa
    }
    
    // ============ VARIABLES DE ESTADO ============
    
    // Cuentas de gas por usuario
    mapping(address => GasAccount) public gasAccounts;
    
    // Tareas automáticas
    mapping(uint256 => AutoTask) public autoTasks;
    uint256 public taskCount;
    
    // Tokens soportados para conversión
    mapping(address => bool) public supportedTokens;
    address[] public tokenList;
    
    // Configuración
    ISwapRouter public swapRouter;
    address public wrappedNative;
    uint256 public minGasBalance = 0.005 ether;  // Mínimo para operaciones
    uint256 public maxSlippage = 50;              // 0.5% slippage máximo
    
    // Estadísticas
    uint256 public totalGasDeposited;     // ETH total acreditado a cuentas
    uint256 public totalGasDistributed;   // ETH total consumido en tareas
    uint256 public totalConversions;

    // Flag para evitar que receive() acredite ETH durante un swap interno
    bool private _swapping;
    
    // ============ EVENTOS ============
    
    event GasDeposited(address indexed user, uint256 amount);
    event GasWithdrawn(address indexed user, uint256 amount);
    event TokensConverted(address indexed token, uint256 tokenAmount, uint256 ethReceived);
    event AutoTaskCreated(uint256 indexed taskId, address target);
    event AutoTaskExecuted(uint256 indexed taskId, bool success);
    event GasTopUp(address indexed user, uint256 amount);
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _swapRouter, address _wrappedNative) {
        swapRouter = ISwapRouter(_swapRouter);
        wrappedNative = _wrappedNative;
    }
    
    // ============ FUNCIONES DE DEPÓSITO ============
    
    /**
     * @dev Deposita ETH directamente en la cuenta de gas
     */
    function depositGas() external payable nonReentrant {
        require(msg.value > 0, "Must send ETH");
        
        gasAccounts[msg.sender].balance += msg.value;
        gasAccounts[msg.sender].totalDeposited += msg.value;
        gasAccounts[msg.sender].lastTopUp = block.timestamp;
        
        totalGasDeposited += msg.value;
        
        emit GasDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Deposita tokens y los convierte a ETH para gas
     * @param token Dirección del token
     * @param amount Cantidad de tokens
     */
    function depositTokensForGas(address token, uint256 amount) 
        external 
        nonReentrant 
    {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be > 0");
        
        // Transferir tokens al contrato
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Convertir a ETH
        uint256 ethReceived = _convertToETH(token, amount);
        
        // Acreditar al usuario
        gasAccounts[msg.sender].balance += ethReceived;
        gasAccounts[msg.sender].totalDeposited += ethReceived;
        gasAccounts[msg.sender].lastTopUp = block.timestamp;
        
        totalGasDeposited += ethReceived;
        totalConversions++;
        
        emit TokensConverted(token, amount, ethReceived);
        emit GasDeposited(msg.sender, ethReceived);
    }
    
    /**
     * @dev Convierte tokens a ETH usando el router
     */
    function _convertToETH(address token, uint256 amount) internal returns (uint256) {
        // Preparar path
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = wrappedNative;
        
        // Calcular mínimo aceptable (con slippage)
        uint256[] memory amountsOut = swapRouter.getAmountsOut(amount, path);
        uint256 minOut = (amountsOut[1] * (10000 - maxSlippage)) / 10000;
        
        // Aprobar y ejecutar swap
        IERC20(token).approve(address(swapRouter), amount);
        
        uint256 balanceBefore = address(this).balance;
        
        _swapping = true;
        swapRouter.swapExactTokensForETH(
            amount,
            minOut,
            path,
            address(this),
            block.timestamp + 300
        );
        _swapping = false;
        
        return address(this).balance - balanceBefore;
    }
    
    // ============ FUNCIONES DE RETIRO ============
    
    /**
     * @dev Retira ETH de la cuenta de gas
     * @param amount Cantidad a retirar
     */
    function withdrawGas(uint256 amount) external nonReentrant {
        require(gasAccounts[msg.sender].balance >= amount, "Insufficient balance");
        
        gasAccounts[msg.sender].balance -= amount;
        gasAccounts[msg.sender].totalUsed += amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit GasWithdrawn(msg.sender, amount);
    }
    
    // ============ FUNCIONES DE TAREAS AUTOMÁTICAS ============
    
    /**
     * @dev Crea una tarea automática
     * @param target Contrato objetivo
     * @param data Calldata de la función
     * @param gasLimit Límite de gas
     * @param interval Intervalo en segundos
     */
    function createAutoTask(
        address target,
        bytes calldata data,
        uint256 gasLimit,
        uint256 interval
    ) external returns (uint256 taskId) {
        require(gasAccounts[msg.sender].balance >= minGasBalance, "Insufficient gas balance");
        
        taskId = taskCount++;
        
        autoTasks[taskId] = AutoTask({
            owner: msg.sender,
            target: target,
            data: data,
            gasLimit: gasLimit,
            interval: interval,
            lastExecution: 0,
            isActive: true
        });
        
        emit AutoTaskCreated(taskId, target);
    }
    
    /**
     * @dev Ejecuta una tarea automática (llamado por keeper/automation)
     * @param taskId ID de la tarea
     *
     * El gas se descuenta SIEMPRE de la cuenta del dueño registrado de la
     * tarea (`task.owner`), nunca de un usuario arbitrario pasado por quien
     * llama. Esto evita que un atacante drene la cuenta de gas de otra
     * persona ejecutando tareas contra ella.
     */
    function executeAutoTask(uint256 taskId) 
        external 
        nonReentrant 
    {
        AutoTask storage task = autoTasks[taskId];
        require(task.isActive, "Task not active");
        require(
            block.timestamp >= task.lastExecution + task.interval,
            "Too early"
        );
        
        address taskOwner = task.owner;
        
        // Verificar que el dueño de la tarea tiene gas suficiente
        uint256 gasCost = task.gasLimit * tx.gasprice;
        require(gasAccounts[taskOwner].balance >= gasCost, "Insufficient gas");
        
        // Descontar gas ANTES de la llamada externa (checks-effects-interactions)
        gasAccounts[taskOwner].balance -= gasCost;
        gasAccounts[taskOwner].totalUsed += gasCost;
        totalGasDistributed += gasCost;
        
        // Actualizar timestamp antes de ejecutar para prevenir re-ejecución
        task.lastExecution = block.timestamp;
        
        // Ejecutar la tarea
        (bool success, ) = task.target.call{gas: task.gasLimit}(task.data);
        
        emit AutoTaskExecuted(taskId, success);
    }
    
    /**
     * @dev Cancela una tarea automática. Solo el dueño de la tarea o el
     *      owner del contrato pueden cancelarla.
     */
    function cancelAutoTask(uint256 taskId) external {
        AutoTask storage task = autoTasks[taskId];
        require(
            msg.sender == task.owner || msg.sender == owner(),
            "Not authorized"
        );
        task.isActive = false;
    }
    
    // ============ FUNCIONES DE TOP-UP AUTOMÁTICO ============
    
    /**
     * @dev Verifica si un usuario necesita top-up de gas
     */
    function needsTopUp(address user) external view returns (bool) {
        return gasAccounts[user].balance < minGasBalance;
    }
    
    /**
     * @dev Ejecuta top-up automático desde el pool
     * @param user Usuario a recargar
     * @param amount Cantidad de ETH
     */
    function autoTopUp(address user, uint256 amount) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(address(this).balance >= amount, "Insufficient contract balance");
        
        gasAccounts[user].balance += amount;
        gasAccounts[user].totalDeposited += amount;
        gasAccounts[user].lastTopUp = block.timestamp;
        
        emit GasTopUp(user, amount);
    }
    
    // ============ FUNCIONES DE ADMINISTRACIÓN ============
    
    /**
     * @dev Agrega un token soportado
     */
    function addSupportedToken(address token) external onlyOwner {
        require(!supportedTokens[token], "Already supported");
        supportedTokens[token] = true;
        tokenList.push(token);
    }
    
    /**
     * @dev Remueve un token soportado
     */
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }
    
    /**
     * @dev Actualiza configuración
     */
    function updateConfig(
        uint256 _minGasBalance,
        uint256 _maxSlippage
    ) external onlyOwner {
        minGasBalance = _minGasBalance;
        maxSlippage = _maxSlippage;
    }
    
    /**
     * @dev Actualiza el router
     */
    function setSwapRouter(address newRouter) external onlyOwner {
        swapRouter = ISwapRouter(newRouter);
    }
    
    // ============ FUNCIONES DE VISTA ============
    
    /**
     * @dev Obtiene el balance de gas de un usuario
     */
    function getGasBalance(address user) external view returns (uint256) {
        return gasAccounts[user].balance;
    }
    
    /**
     * @dev Obtiene información completa de cuenta
     */
    function getAccountInfo(address user) external view returns (
        uint256 balance,
        uint256 totalDeposited,
        uint256 totalUsed,
        uint256 lastTopUp
    ) {
        GasAccount memory acc = gasAccounts[user];
        return (acc.balance, acc.totalDeposited, acc.totalUsed, acc.lastTopUp);
    }
    
    /**
     * @dev Obtiene cantidad de tokens soportados
     */
    function getSupportedTokenCount() external view returns (uint256) {
        return tokenList.length;
    }
    
    // ============ RECIBIR ETH ============
    
    receive() external payable {
        // Durante un swap interno el router envía ETH al contrato:
        // ese ETH ya se contabiliza vía el diff de balance en _convertToETH,
        // por lo que NO debe acreditarse aquí para evitar doble contabilización.
        if (_swapping) {
            return;
        }
        // Permite recibir ETH directamente
        gasAccounts[msg.sender].balance += msg.value;
        totalGasDeposited += msg.value;
        emit GasDeposited(msg.sender, msg.value);
    }
}
