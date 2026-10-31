// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

/// @title ASUiteToken
/// @notice Base de la A-Suite para tokens de utilidad, pago y reserva.
/// @dev ERC-20 con firma EIP-2612 (Permit) y pausa real de transferencias
///      (ERC20Pausable). El supply inicial se acuña al desplegador.
abstract contract ASUiteToken is ERC20, ERC20Permit, ERC20Pausable, Ownable {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply
    ) ERC20(name_, symbol_) ERC20Permit(name_) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Acuña tokens nuevos (solo el propietario).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}

/// @title ASUiteVotesToken
/// @notice Base de la A-Suite para tokens de gobernanza.
/// @dev ERC-20 con checkpoints de voto (ERC20Votes) y Permit. Hay que delegar
///      para que el poder de voto cuente.
abstract contract ASUiteVotesToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply
    ) ERC20(name_, symbol_) ERC20Permit(name_) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Acuña tokens nuevos (solo el propietario).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
