// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ASuiteBase.sol";

/// @title APAY - A-Pago
/// @notice Token de la serie de la A-Suite. Supply inicial: 200.000.000.
contract APAY is ASUiteToken {
    constructor()
        ASUiteToken("A-Pago", "APAY", 200_000_000 ether)
    {}
}
