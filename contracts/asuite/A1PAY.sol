// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ASuiteBase.sol";

/// @title A1PAY - A1-Pago
/// @notice Token de la serie de la A-Suite. Supply inicial: 180.000.000.
contract A1PAY is ASUiteToken {
    constructor()
        ASUiteToken("A1-Pago", "A1PAY", 180_000_000 ether)
    {}
}
