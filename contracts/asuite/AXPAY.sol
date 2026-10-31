// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ASuiteBase.sol";

/// @title AXPAY - AX-Pago
/// @notice Token de la serie de la A-Suite. Supply inicial: 160.000.000.
contract AXPAY is ASUiteToken {
    constructor()
        ASUiteToken("AX-Pago", "AXPAY", 160_000_000 ether)
    {}
}
