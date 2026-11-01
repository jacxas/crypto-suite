// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IATreasury
 * @notice Treasury seguro para fees, liquidez y fondos operativos de IA TOKEN SUITE.
 * @dev Diseñado para ser controlado por multisig y/o timelock en produccion.
 */
contract IATreasury is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    address public treasuryMultisig;

    event NativeReceived(address indexed sender, uint256 amount);
    event NativeWithdrawn(address indexed to, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed to, uint256 amount);
    event TreasuryMultisigUpdated(address indexed oldMultisig, address indexed newMultisig);

    /**
     * @notice Inicializa el treasury.
     * @param admin Admin inicial. En produccion debe ser un Timelock o multisig.
     * @param multisig Wallet multisig que puede ejecutar retiros operativos.
     */
    constructor(address admin, address multisig) {
        require(admin != address(0), "Invalid admin");
        require(multisig != address(0), "Invalid multisig");

        treasuryMultisig = multisig;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TREASURER_ROLE, multisig);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(PAUSER_ROLE, multisig);
    }

    /**
     * @notice Recibe BNB/ETH nativo.
     */
    receive() external payable {
        emit NativeReceived(msg.sender, msg.value);
    }

    /**
     * @notice Actualiza la multisig operativa del treasury.
     * @param newMultisig Nueva wallet multisig.
     */
    function updateTreasuryMultisig(address newMultisig) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMultisig != address(0), "Invalid multisig");
        address oldMultisig = treasuryMultisig;
        treasuryMultisig = newMultisig;

        _revokeRole(TREASURER_ROLE, oldMultisig);
        _revokeRole(PAUSER_ROLE, oldMultisig);
        _grantRole(TREASURER_ROLE, newMultisig);
        _grantRole(PAUSER_ROLE, newMultisig);

        emit TreasuryMultisigUpdated(oldMultisig, newMultisig);
    }

    /**
     * @notice Pausa retiros del treasury.
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Reactiva retiros del treasury.
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Retira moneda nativa a una direccion aprobada.
     * @param to Receptor.
     * @param amount Cantidad a retirar.
     */
    function withdrawNative(address payable to, uint256 amount)
        external
        onlyRole(TREASURER_ROLE)
        whenNotPaused
        nonReentrant
    {
        require(to != address(0), "Invalid receiver");
        require(address(this).balance >= amount, "Insufficient balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "Native transfer failed");

        emit NativeWithdrawn(to, amount);
    }

    /**
     * @notice Retira un ERC20/BEP20 del treasury.
     * @param token Token a retirar.
     * @param to Receptor.
     * @param amount Cantidad a retirar.
     */
    function withdrawToken(address token, address to, uint256 amount)
        external
        onlyRole(TREASURER_ROLE)
        whenNotPaused
        nonReentrant
    {
        require(token != address(0), "Invalid token");
        require(to != address(0), "Invalid receiver");

        IERC20(token).safeTransfer(to, amount);
        emit TokenWithdrawn(token, to, amount);
    }

    /**
     * @notice Consulta balance ERC20/BEP20 del treasury.
     * @param token Token a consultar.
     * @return uint256 Balance del treasury.
     */
    function tokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}