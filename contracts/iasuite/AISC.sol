// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AISC - AI Secure Token
 * @notice Token de seguridad y validación del ecosistema
 * @dev Utilizado para validar transacciones y asegurar el protocolo
 */
contract AISC is ERC20, Ownable {
    uint256 private constant MAX_SUPPLY = 25_000_000 * 10**18; // 25 millones
    address public iaHub;
    
    mapping(address => bool) public validators;
    mapping(address => uint256) public securityScore;
    mapping(bytes32 => bool) public validatedTransactions;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event TransactionValidated(bytes32 indexed txHash, address indexed validator);
    event SecurityScoreUpdated(address indexed user, uint256 score);
    event IAHubUpdated(address indexed oldHub, address indexed newHub);

    /**
     * @notice Constructor del token AISC
     * @param initialSupply Suministro inicial del token
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(uint256 initialSupply, address initialOwner) ERC20("AI Secure", "AISC") Ownable(initialOwner) {
        require(initialSupply <= MAX_SUPPLY, "Supply exceeds maximum");
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
            emit Minted(initialOwner, initialSupply);
        }
        validators[initialOwner] = true;
        securityScore[initialOwner] = 100;
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
     * @notice Añade un validador
     * @param validator Dirección del validador
     */
    function addValidator(address validator) external onlyOwner {
        validators[validator] = true;
        securityScore[validator] = 100;
        emit ValidatorAdded(validator);
    }

    /**
     * @notice Elimina un validador
     * @param validator Dirección del validador
     */
    function removeValidator(address validator) external onlyOwner {
        validators[validator] = false;
        emit ValidatorRemoved(validator);
    }

    /**
     * @notice Valida una transacción
     * @param txHash Hash de la transacción
     */
    function validateTransaction(bytes32 txHash) external {
        require(validators[msg.sender], "Not a validator");
        require(!validatedTransactions[txHash], "Already validated");
        validatedTransactions[txHash] = true;
        securityScore[msg.sender] += 1;
        emit TransactionValidated(txHash, msg.sender);
    }

    /**
     * @notice Actualiza el puntaje de seguridad de un usuario
     * @param user Dirección del usuario
     * @param score Nuevo puntaje
     */
    function updateSecurityScore(address user, uint256 score) external {
        require(msg.sender == owner() || msg.sender == iaHub, "Not authorized");
        securityScore[user] = score;
        emit SecurityScoreUpdated(user, score);
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
     * @notice Verifica si una transacción está validada
     * @param txHash Hash de la transacción
     * @return bool True si está validada
     */
    function isTransactionValidated(bytes32 txHash) external view returns (bool) {
        return validatedTransactions[txHash];
    }

    /**
     * @notice Obtiene el suministro máximo
     * @return uint256 Suministro máximo
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
}
