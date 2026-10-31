// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ASuiteBase.sol";

/// @title AGOV - A-Gobernanza
/// @notice Token de gobernanza de la A-Suite. Supply inicial: 50.000.000.
contract AGOV is ASUiteVotesToken {
    constructor()
        ASUiteVotesToken("A-Gobernanza", "AGOV", 50_000_000 ether)
    {}
}
