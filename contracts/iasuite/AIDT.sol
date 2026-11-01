// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIDT - AI Data Token
 * @notice Token para almacenamiento descentralizado de datos de IA
 * @dev Permite pagar por almacenamiento y recuperación de datasets
 */
contract AIDT is ERC20, Ownable {
    uint256 private constant MAX_SUPPLY = 100_000_000 * 10**18; // 100 millones
    uint256 private constant MAX_DATA_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB
    address public iaHub;
    
    struct DataStorage {
        bytes32 dataHash;
        uint256 size;
        uint256 timestamp;
        address owner;
        bool active;
    }
    
    mapping(bytes32 => DataStorage) public dataRecords;
    mapping(address => bytes32[]) public userData;
    mapping(address => uint256) public storageCredits;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event DataStored(address indexed owner, bytes32 dataHash, uint256 size);
    event DataRetrieved(address indexed owner, bytes32 dataHash);
    event StorageCreditsAdded(address indexed user, uint256 credits);
    event IAHubUpdated(address indexed oldHub, address indexed newHub);

    /**
     * @notice Constructor del token AIDT
     * @param initialSupply Suministro inicial del token
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(uint256 initialSupply, address initialOwner) ERC20("AI Data", "AIDT") Ownable(initialOwner) {
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
     * @notice Almacena un registro de datos
     * @param dataHash Hash de los datos
     * @param size Tamaño de los datos en bytes
     */
    function storeData(bytes32 dataHash, uint256 size) external {
        require(!dataRecords[dataHash].active, "Data already stored");
        require(size > 0 && size <= MAX_DATA_SIZE, "Invalid data size");
        require(storageCredits[msg.sender] >= size, "Insufficient storage credits");
        
        dataRecords[dataHash] = DataStorage({
            dataHash: dataHash,
            size: size,
            timestamp: block.timestamp,
            owner: msg.sender,
            active: true
        });
        userData[msg.sender].push(dataHash);
        storageCredits[msg.sender] -= size;
        emit DataStored(msg.sender, dataHash, size);
    }

    /**
     * @notice Recupera un registro de datos
     * @param dataHash Hash de los datos a recuperar
     */
    function retrieveData(bytes32 dataHash) external view returns (DataStorage memory) {
        require(dataRecords[dataHash].active, "Data not found");
        return dataRecords[dataHash];
    }

    /**
     * @notice Añade créditos de almacenamiento
     * @param user Dirección del usuario
     * @param credits Cantidad de créditos
     */
    function addStorageCredits(address user, uint256 credits) external {
        require(msg.sender == owner() || msg.sender == iaHub, "Not authorized");
        storageCredits[user] += credits;
        emit StorageCreditsAdded(user, credits);
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
     * @notice Obtiene todos los datos de un usuario
     * @param user Dirección del usuario
     * @return bytes32[] Array de hashes de datos
     */
    function getUserData(address user) external view returns (bytes32[] memory) {
        return userData[user];
    }

    /**
     * @notice Obtiene el suministro máximo
     * @return uint256 Suministro máximo
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
}
