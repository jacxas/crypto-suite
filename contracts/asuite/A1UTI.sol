// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ASuiteBase.sol";

/// @title A1UTI - A1-Utilidad
/// @notice Token de la serie de la A-Suite. Supply inicial: 75.000.000.
contract A1UTI is ASUiteToken {
    constructor()
        ASUiteToken("A1-Utilidad", "A1UTI", 75_000_000 ether)
    {}
}
