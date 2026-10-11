// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ASuiteBase.sol";

/// @title A1GOV - A1-Gobernanza
/// @notice Token de gobernanza de la A-Suite. Supply inicial: 30.000.000.
contract A1GOV is ASUiteVotesToken {
    constructor()
        ASUiteVotesToken("A1-Gobernanza", "A1GOV", 30_000_000 ether)
    {}
}
