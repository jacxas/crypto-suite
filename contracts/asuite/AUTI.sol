// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ASuiteBase.sol";

/// @title AUTI - A-Utilidad
/// @notice Token de la serie de la A-Suite. Supply inicial: 100.000.000.
contract AUTI is ASUiteToken {
    constructor()
        ASUiteToken("A-Utilidad", "AUTI", 100_000_000 ether)
    {}
}
