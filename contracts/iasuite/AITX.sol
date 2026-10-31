// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AITX - AI Transaction Token
 * @notice Token de gas interno del ecosistema IA
 * @dev Se utiliza para pagar tarifas de transacciones dentro del protocolo
 */
contract AITX is ERC20, Ownable {
    uint256 private constant MAX_SUPPLY = 500_000_000 * 10**18; // 500 millones
    address public iaHub;
    uint256 public gasPrice; // Precio del gas en tokens
    uint256 public totalGasCollected;
    
    mapping(address => uint256) public gasBalance;
    mapping(address => bool) public feeExempt;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event GasPaid(address indexed payer, uint256 amount);
    event GasPriceUpdated(uint256 newPrice);
    event FeeExemptStatusChanged(address indexed user, bool exempt);
    event IAHubUpdated(address indexed oldHub, address indexed newHub);

    /**
     * @notice Constructor del token AITX
     * @param initialSupply Suministro inicial del token
     * @param initialOwner Dirección del propietario inicial
     * @param _gasPrice Precio inicial del gas
     */
    constructor(uint256 initialSupply, address initialOwner, uint256 _gasPrice) 
        ERC20("AI Transaction", "AITX") Ownable(initialOwner) 
    {
        require(initialSupply <= MAX_SUPPLY, "Supply exceeds maximum");
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
            emit Minted(initialOwner, initialSupply);
        }
        gasPrice = _gasPrice;
        feeExempt[initialOwner] = true;
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
     * @notice Actualiza el precio del gas
     * @param newPrice Nuevo precio
     */
    function setGasPrice(uint256 newPrice) external onlyOwner {
        gasPrice = newPrice;
        emit GasPriceUpdated(newPrice);
    }

    /**
     * @notice Cambia el estado de exención de tarifas
     * @param user Dirección del usuario
     * @param exempt Estado de exención
     */
    function setFeeExempt(address user, bool exempt) external onlyOwner {
        feeExempt[user] = exempt;
        emit FeeExemptStatusChanged(user, exempt);
    }

    /**
     * @notice Paga gas por una operación
     * @param amount Cantidad de gas a pagar
     */
    function payGas(uint256 amount) external {
        require(!feeExempt[msg.sender], "Fee exempt");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
        totalGasCollected += amount;
        emit GasPaid(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }

    /**
     * @notice Añade balance de gas a un usuario
     * @param user Dirección del usuario
     * @param amount Cantidad a añadir
     */
    function addGasBalance(address user, uint256 amount) external {
        require(msg.sender == owner() || msg.sender == iaHub, "Not authorized");
        gasBalance[user] += amount;
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
     * @notice Transfiere tokens con pago de gas automático
     * @param to Dirección destino
     * @param amount Cantidad a transferir
     * @return bool Éxito de la transferencia
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        if (!feeExempt[msg.sender] && gasPrice > 0) {
            require(balanceOf(msg.sender) >= amount + gasPrice, "Insufficient balance for transfer + gas");
            _burn(msg.sender, gasPrice);
            totalGasCollected += gasPrice;
            emit GasPaid(msg.sender, gasPrice);
            emit Burned(msg.sender, gasPrice);
        }
        return super.transfer(to, amount);
    }

    /**
     * @notice Obtiene el suministro máximo
     * @return uint256 Suministro máximo
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
}
