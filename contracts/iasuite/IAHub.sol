// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IAHub - Hub Central del Ecosistema IA TOKEN SUITE
 * @notice Contrato central que conecta y gestiona los 10 tokens del ecosistema
 * @dev Administra permisos, conexiones entre tokens y operaciones cross-token
 */
contract IAHub is Ownable {
    // Direcciones de los tokens
    address public aithToken;  // AI Thinker - Gobernanza
    address public aiprToken;  // AI Processor - Pago por tareas
    address public aidtToken;  // AI Data - Almacenamiento
    address public aiscToken;  // AI Secure - Seguridad
    address public aibtToken;  // AI Bot - Agentes autónomos
    address public aiwrToken;  // AI Reward - Recompensas
    address public aicrToken;  // AI Creator - Desarrolladores
    address public aitxToken;  // AI Transaction - Gas interno
    address public aiexToken;  // AI Exchange - Intercambio
    address public aifaToken;  // AI Farm - Farming

    // Permisos
    mapping(address => bool) public authorizedContracts;
    mapping(address => bool) public tokenRegistry;
    mapping(bytes32 => bool) public executedOperations;

    // Eventos
    event TokenRegistered(string tokenName, address tokenAddress);
    event ContractAuthorized(address indexed contractAddress);
    event ContractDeauthorized(address indexed contractAddress);
    event CrossTokenTransfer(address indexed fromToken, address indexed toToken, uint256 amount);
    event OperationExecuted(bytes32 indexed opHash, string operation);
    event EmergencyPause(bool paused);

    bool public paused;

    /**
     * @notice Constructor del IAHub
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        authorizedContracts[initialOwner] = true;
    }

    /**
     * @notice Registra un token en el hub
     * @param tokenName Nombre del token
     * @param tokenAddress Dirección del token
     */
    function registerToken(string memory tokenName, address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Invalid address");
        require(!tokenRegistry[tokenAddress], "Token already registered");
        
        tokenRegistry[tokenAddress] = true;
        
        if (keccak256(bytes(tokenName)) == keccak256(bytes("AITH"))) {
            aithToken = tokenAddress;
        } else if (keccak256(bytes(tokenName)) == keccak256(bytes("AIPR"))) {
            aiprToken = tokenAddress;
        } else if (keccak256(bytes(tokenName)) == keccak256(bytes("AIDT"))) {
            aidtToken = tokenAddress;
        } else if (keccak256(bytes(tokenName)) == keccak256(bytes("AISC"))) {
            aiscToken = tokenAddress;
        } else if (keccak256(bytes(tokenName)) == keccak256(bytes("AIBT"))) {
            aibtToken = tokenAddress;
        } else if (keccak256(bytes(tokenName)) == keccak256(bytes("AIWR"))) {
            aiwrToken = tokenAddress;
        } else if (keccak256(bytes(tokenName)) == keccak256(bytes("AICR"))) {
            aicrToken = tokenAddress;
        } else if (keccak256(bytes(tokenName)) == keccak256(bytes("AITX"))) {
            aitxToken = tokenAddress;
        } else if (keccak256(bytes(tokenName)) == keccak256(bytes("AIEX"))) {
            aiexToken = tokenAddress;
        } else if (keccak256(bytes(tokenName)) == keccak256(bytes("AIFA"))) {
            aifaToken = tokenAddress;
        }
        
        emit TokenRegistered(tokenName, tokenAddress);
    }

    /**
     * @notice Autoriza un contrato
     * @param contractAddress Dirección del contrato
     */
    function authorizeContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = true;
        emit ContractAuthorized(contractAddress);
    }

    /**
     * @notice Desautoriza un contrato
     * @param contractAddress Dirección del contrato
     */
    function deauthorizeContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = false;
        emit ContractDeauthorized(contractAddress);
    }

    /**
     * @notice Actualiza la dirección del hub en todos los tokens
     */
    function updateAllTokensHub() external onlyOwner {
        _callToken(aithToken, "setIAHub", abi.encode(address(this)));
        _callToken(aiprToken, "setIAHub", abi.encode(address(this)));
        _callToken(aidtToken, "setIAHub", abi.encode(address(this)));
        _callToken(aiscToken, "setIAHub", abi.encode(address(this)));
        _callToken(aibtToken, "setIAHub", abi.encode(address(this)));
        _callToken(aiwrToken, "setIAHub", abi.encode(address(this)));
        _callToken(aicrToken, "setIAHub", abi.encode(address(this)));
        _callToken(aitxToken, "setIAHub", abi.encode(address(this)));
        _callToken(aiexToken, "setIAHub", abi.encode(address(this)));
        _callToken(aifaToken, "setIAHub", abi.encode(address(this)));
    }

    /**
     * @notice Ejecuta una operación cross-token
     * @param fromToken Token de origen
     * @param toToken Token de destino
     * @param amount Cantidad
     * @param operation Descripción de la operación
     */
    function executeCrossTokenOperation(
        address fromToken,
        address toToken,
        uint256 amount,
        string memory operation
    ) external {
        require(!paused, "Protocol paused");
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        require(tokenRegistry[fromToken] && tokenRegistry[toToken], "Invalid tokens");
        
        bytes32 opHash = keccak256(abi.encodePacked(fromToken, toToken, amount, block.timestamp));
        require(!executedOperations[opHash], "Operation already executed");
        executedOperations[opHash] = true;
        
        emit CrossTokenTransfer(fromToken, toToken, amount);
        emit OperationExecuted(opHash, operation);
    }

    /**
     * @notice Pausa el protocolo en caso de emergencia
     * @param _paused Estado de pausa
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit EmergencyPause(_paused);
    }

    /**
     * @notice Obtiene todas las direcciones de tokens
     * @return addresses Array de direcciones de tokens
     */
    function getAllTokenAddresses() external view returns (address[10] memory) {
        return [aithToken, aiprToken, aidtToken, aiscToken, aibtToken, aiwrToken, aicrToken, aitxToken, aiexToken, aifaToken];
    }

    /**
     * @notice Obtiene los nombres de todos los tokens
     * @return names Array de nombres
     */
    function getAllTokenNames() external pure returns (string[10] memory) {
        return ["AITH", "AIPR", "AIDT", "AISC", "AIBT", "AIWR", "AICR", "AITX", "AIEX", "AIFA"];
    }

    /**
     * @notice Verifica si un token está registrado
     * @param tokenAddress Dirección del token
     * @return bool True si está registrado
     */
    function isTokenRegistered(address tokenAddress) external view returns (bool) {
        return tokenRegistry[tokenAddress];
    }

    /**
     * @notice Llama a una función de un token
     * @param tokenAddress Dirección del token
     * @param functionName Nombre de la función
     * @param data Datos codificados
     */
    function _callToken(address tokenAddress, string memory functionName, bytes memory data) internal {
        require(tokenAddress != address(0), "Token not registered");
        (bool success, ) = tokenAddress.call(
            abi.encodeWithSignature(string.concat(functionName, "(address)"), abi.decode(data, (address)))
        );
        require(success, "Token call failed");
    }
}
