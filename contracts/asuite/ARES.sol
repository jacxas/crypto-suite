// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ASuiteBase.sol";

/// @title ARES - A-Reserva
/// @notice Token de la serie de la A-Suite. Supply inicial: 150.000.000.
contract ARES is ASUiteToken {
    constructor()
        ASUiteToken("A-Reserva", "ARES", 150_000_000 ether)
    {}
}
