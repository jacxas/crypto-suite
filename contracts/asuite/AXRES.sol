// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ASuiteBase.sol";

/// @title AXRES - AX-Reserva
/// @notice Token de la serie de la A-Suite. Supply inicial: 120.000.000.
contract AXRES is ASUiteToken {
    constructor()
        ASUiteToken("AX-Reserva", "AXRES", 120_000_000 ether)
    {}
}
