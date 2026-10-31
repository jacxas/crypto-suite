// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ASuiteBase.sol";

/// @title AXGOV - AX-Gobernanza
/// @notice Token de gobernanza de la A-Suite. Supply inicial: 25.000.000.
contract AXGOV is ASUiteVotesToken {
    constructor()
        ASUiteVotesToken("AX-Gobernanza", "AXGOV", 25_000_000 ether)
    {}
}
