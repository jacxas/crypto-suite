// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIBT - AI Bot Token
 * @notice Token para ejecución de agentes autónomos de IA
 * @dev Permite desplegar, ejecutar y gestionar bots inteligentes
 */
contract AIBT is ERC20, Ownable {
    uint256 private constant MAX_SUPPLY = 30_000_000 * 10**18; // 30 millones
    uint256 private constant MAX_BOTS_PER_USER = 100;
    address public iaHub;
    
    enum BotStatus { INACTIVE, ACTIVE, PAUSED, TERMINATED }
    
    struct Bot {
        uint256 id;
        string name;
        address owner;
        BotStatus status;
        uint256 executionCount;
        uint256 lastExecution;
        uint256 tokensStaked;
    }
    
    mapping(uint256 => Bot) public bots;
    mapping(address => uint256[]) public userBots;
    uint256 public botCounter;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event BotCreated(uint256 indexed botId, address indexed owner, string name);
    event BotExecuted(uint256 indexed botId, uint256 timestamp);
    event BotStatusChanged(uint256 indexed botId, BotStatus newStatus);
    event IAHubUpdated(address indexed oldHub, address indexed newHub);

    /**
     * @notice Constructor del token AIBT
     * @param initialSupply Suministro inicial del token
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(uint256 initialSupply, address initialOwner) ERC20("AI Bot", "AIBT") Ownable(initialOwner) {
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
     * @notice Crea un nuevo bot autónomo
     * @param name Nombre del bot
     * @param stakeAmount Cantidad de tokens en staking
     */
    function createBot(string memory name, uint256 stakeAmount) external {
        require(stakeAmount <= balanceOf(msg.sender), "Insufficient balance");
        require(userBots[msg.sender].length < MAX_BOTS_PER_USER, "Max bots per user exceeded");
        require(bytes(name).length > 0 && bytes(name).length <= 100, "Invalid bot name");
        
        botCounter++;
        bots[botCounter] = Bot({
            id: botCounter,
            name: name,
            owner: msg.sender,
            status: BotStatus.ACTIVE,
            executionCount: 0,
            lastExecution: block.timestamp,
            tokensStaked: stakeAmount
        });
        userBots[msg.sender].push(botCounter);
        emit BotCreated(botCounter, msg.sender, name);
    }

    /**
     * @notice Ejecuta un bot
     * @param botId ID del bot
     */
    function executeBot(uint256 botId) external {
        Bot storage bot = bots[botId];
        require(bot.owner == msg.sender || msg.sender == iaHub, "Not authorized");
        require(bot.status == BotStatus.ACTIVE, "Bot not active");
        
        bot.executionCount++;
        bot.lastExecution = block.timestamp;
        emit BotExecuted(botId, block.timestamp);
    }

    /**
     * @notice Cambia el estado de un bot
     * @param botId ID del bot
     * @param status Nuevo estado
     */
    function changeBotStatus(uint256 botId, BotStatus status) external {
        Bot storage bot = bots[botId];
        require(bot.owner == msg.sender, "Not the owner");
        bot.status = status;
        emit BotStatusChanged(botId, status);
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
     * @notice Obtiene los bots de un usuario
     * @param user Dirección del usuario
     * @return uint256[] Array de IDs de bots
     */
    function getUserBots(address user) external view returns (uint256[] memory) {
        return userBots[user];
    }

    /**
     * @notice Obtiene información de un bot
     * @param botId ID del bot
     * @return Bot Información del bot
     */
    function getBot(uint256 botId) external view returns (Bot memory) {
        return bots[botId];
    }

    /**
     * @notice Obtiene el suministro máximo
     * @return uint256 Suministro máximo
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
}
