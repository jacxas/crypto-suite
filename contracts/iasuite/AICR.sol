// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AICR - AI Creator Token
 * @notice Token para desarrolladores de IA
 * @dev Incentiva la creación de modelos, herramientas y contribuciones al ecosistema
 */
contract AICR is ERC20, Ownable {
    uint256 private constant MAX_SUPPLY = 75_000_000 * 10**18; // 75 millones
    uint256 private constant MAX_REWARD_PER_CONTRIBUTION = 1_000_000 * 10**18; // 1M tokens
    address public iaHub;
    
    enum ContributionType { MODEL, TOOL, DATASET, DOCUMENTATION, OTHER }
    
    struct Contribution {
        uint256 id;
        address creator;
        string name;
        ContributionType ctype;
        uint256 reward;
        uint256 timestamp;
        bool approved;
    }
    
    mapping(uint256 => Contribution) public contributions;
    mapping(address => uint256[]) public creatorContributions;
    mapping(address => uint256) public creatorReputation;
    uint256 public contributionCounter;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event ContributionSubmitted(uint256 indexed id, address indexed creator, string name);
    event ContributionApproved(uint256 indexed id, uint256 reward);
    event ReputationUpdated(address indexed creator, uint256 reputation);
    event IAHubUpdated(address indexed oldHub, address indexed newHub);

    /**
     * @notice Constructor del token AICR
     * @param initialSupply Suministro inicial del token
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(uint256 initialSupply, address initialOwner) ERC20("AI Creator", "AICR") Ownable(initialOwner) {
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
     * @notice Envía una contribución
     * @param name Nombre de la contribución
     * @param ctype Tipo de contribución
     */
    function submitContribution(string memory name, ContributionType ctype) external {
        contributionCounter++;
        contributions[contributionCounter] = Contribution({
            id: contributionCounter,
            creator: msg.sender,
            name: name,
            ctype: ctype,
            reward: 0,
            timestamp: block.timestamp,
            approved: false
        });
        creatorContributions[msg.sender].push(contributionCounter);
        emit ContributionSubmitted(contributionCounter, msg.sender, name);
    }

    /**
     * @notice Aprueba una contribución y distribuye recompensa
     * @param contributionId ID de la contribución
     * @param reward Cantidad de tokens de recompensa
     */
    function approveContribution(uint256 contributionId, uint256 reward) external {
        require(msg.sender == owner() || msg.sender == iaHub, "Not authorized");
        Contribution storage contrib = contributions[contributionId];
        require(!contrib.approved, "Already approved");
        require(reward > 0 && reward <= MAX_REWARD_PER_CONTRIBUTION, "Invalid reward amount");
        require(totalSupply() + reward <= MAX_SUPPLY, "Max supply exceeded");
        
        contrib.approved = true;
        contrib.reward = reward;
        _mint(contrib.creator, reward);
        creatorReputation[contrib.creator] += reward / 10**18;
        
        emit ContributionApproved(contributionId, reward);
        emit Minted(contrib.creator, reward);
    }

    /**
     * @notice Actualiza la reputación de un creador
     * @param creator Dirección del creador
     * @param reputation Nueva reputación
     */
    function updateReputation(address creator, uint256 reputation) external {
        require(msg.sender == owner() || msg.sender == iaHub, "Not authorized");
        creatorReputation[creator] = reputation;
        emit ReputationUpdated(creator, reputation);
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
     * @notice Obtiene contribuciones de un creador
     * @param creator Dirección del creador
     * @return uint256[] Array de IDs de contribuciones
     */
    function getCreatorContributions(address creator) external view returns (uint256[] memory) {
        return creatorContributions[creator];
    }

    /**
     * @notice Obtiene el suministro máximo
     * @return uint256 Suministro máximo
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
}
