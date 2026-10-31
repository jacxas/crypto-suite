// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AITH - AI Thinker Token
 * @notice Token de gobernanza del sistema IA TOKEN SUITE
 * @dev Permite votar en propuestas del ecosistema y gestionar decisiones del protocolo
 */
contract AITH is ERC20, Ownable {
    uint256 private constant MAX_SUPPLY = 10_000_000 * 10**18; // 10 millones
    address public iaHub;
    mapping(address => bool) public governanceMembers;
    mapping(address => uint256) public votingPower;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event GovernanceMemberAdded(address indexed member);
    event GovernanceMemberRemoved(address indexed member);
    event VotingPowerUpdated(address indexed member, uint256 power);
    event IAHubUpdated(address indexed oldHub, address indexed newHub);

    /**
     * @notice Constructor del token AITH
     * @param initialSupply Suministro inicial del token
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(uint256 initialSupply, address initialOwner) ERC20("AI Thinker", "AITH") Ownable(initialOwner) {
        require(initialSupply <= MAX_SUPPLY, "Supply exceeds maximum");
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
            emit Minted(initialOwner, initialSupply);
        }
        governanceMembers[initialOwner] = true;
        votingPower[initialOwner] = initialSupply;
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
     * @notice Añade un miembro de gobernanza
     * @param member Dirección del nuevo miembro
     */
    function addGovernanceMember(address member) external onlyOwner {
        governanceMembers[member] = true;
        emit GovernanceMemberAdded(member);
    }

    /**
     * @notice Elimina un miembro de gobernanza
     * @param member Dirección del miembro a eliminar
     */
    function removeGovernanceMember(address member) external onlyOwner {
        governanceMembers[member] = false;
        votingPower[member] = 0;
        emit GovernanceMemberRemoved(member);
    }

    /**
     * @notice Actualiza el poder de voto de un miembro
     * @param member Dirección del miembro
     * @param power Nuevo poder de voto
     */
    function updateVotingPower(address member, uint256 power) external onlyOwner {
        votingPower[member] = power;
        emit VotingPowerUpdated(member, power);
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
     * @notice Quema tokens de una dirección específica (solo IAHub o owner)
     * @param from Dirección de origen
     * @param amount Cantidad a quemar
     */
    function burnFrom(address from, uint256 amount) external {
        require(msg.sender == owner() || msg.sender == iaHub, "Not authorized");
        _burn(from, amount);
        emit Burned(from, amount);
    }

    /**
     * @notice Verifica si una dirección puede votar
     * @param member Dirección a verificar
     * @return bool True si puede votar
     */
    function canVote(address member) external view returns (bool) {
        return governanceMembers[member] && votingPower[member] > 0;
    }

    /**
     * @notice Obtiene el suministro máximo
     * @return uint256 Suministro máximo
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }

    /**
     * @notice Transferencia con actualización de poder de voto
     * @param to Dirección destino
     * @param amount Cantidad a transferir
     * @return bool Éxito de la transferencia
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        bool success = super.transfer(to, amount);
        if (governanceMembers[msg.sender]) {
            votingPower[msg.sender] -= amount;
        }
        if (governanceMembers[to]) {
            votingPower[to] += amount;
        }
        return success;
    }
}
