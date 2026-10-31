// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20
/// @notice Token ERC20 minimo para los tests.
/// @dev No es parte del producto: existe para que los tests tengan un token
///      desechable. Mintea el supply inicial al desplegador y expone `mint`.
contract MockERC20 is ERC20 {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply
    ) ERC20(name_, symbol_) {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Mintea tokens sin restricciones (solo para tests).
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
