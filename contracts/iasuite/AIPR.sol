// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIPR - AI Processor Token
 * @notice Token de pago por tareas de procesamiento de IA
 * @dev Se utiliza para compensar nodos que ejecutan tareas computacionales de IA
 */
contract AIPR is ERC20, Ownable {
    uint256 private constant MAX_SUPPLY = 50_000_000 * 10**18; // 50 millones
    address public iaHub;
    mapping(address => uint256) public processedTasks;
    mapping(address => uint256) public taskRewards;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event TaskProcessed(address indexed processor, uint256 taskId, uint256 reward);
    event IAHubUpdated(address indexed oldHub, address indexed newHub);

    /**
     * @notice Constructor del token AIPR
     * @param initialSupply Suministro inicial del token
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(uint256 initialSupply, address initialOwner) ERC20("AI Processor", "AIPR") Ownable(initialOwner) {
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
     * @notice Registra una tarea procesada y distribuye recompensa
     * @param processor Dirección del procesador
     * @param taskId ID de la tarea
     * @param reward Recompensa en tokens
     */
    function registerTask(address processor, uint256 taskId, uint256 reward) external {
        require(msg.sender == owner() || msg.sender == iaHub, "Not authorized");
        require(totalSupply() + reward <= MAX_SUPPLY, "Max supply exceeded");
        _mint(processor, reward);
        processedTasks[processor] += 1;
        taskRewards[processor] += reward;
        emit TaskProcessed(processor, taskId, reward);
        emit Minted(processor, reward);
    }

    /**
     * @notice Mint de nuevos tokens (solo IAHub o owner)
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
     * @notice Obtiene estadísticas de un procesador
     * @param processor Dirección del procesador
     * @return tasks Número de tareas procesadas
     * @return rewards Total de recompensas recibidas
     */
    function getProcessorStats(address processor) external view returns (uint256 tasks, uint256 rewards) {
        return (processedTasks[processor], taskRewards[processor]);
    }

    /**
     * @notice Obtiene el suministro máximo
     * @return uint256 Suministro máximo
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
}
