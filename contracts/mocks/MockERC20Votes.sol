// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

/// @title MockERC20Votes
/// @notice Token ERC20 con checkpoints de votos (ERC20Votes) para los tests.
/// @dev IMPORTANTE: se implementa con el recetario estandar de OpenZeppelin v5,
///      pero el contrato Governance actual **no usa checkpoints**: cuenta los
///      votos con `governanceToken.balanceOf(account)` (ver Governance.sol).
///      Es decir, hoy `delegate()` no cambia el resultado de una votacion.
///      Este mock esta listo por si Governance migra a getPastVotes().
contract MockERC20Votes is ERC20, ERC20Permit, ERC20Votes {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Mintea tokens sin restricciones (solo para tests).
    function mint(address to, uint256 amount) external {
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
