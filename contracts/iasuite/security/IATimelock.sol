// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title IATimelock
 * @notice Timelock para gobernanza y cambios criticos de IA TOKEN SUITE.
 * @dev Debe recibir ownership/admin de contratos sensibles despues del despliegue.
 */
contract IATimelock is TimelockController {
    /**
     * @notice Inicializa el timelock.
     * @param minDelay Delay minimo para operaciones criticas.
     * @param proposers Direcciones que pueden proponer operaciones.
     * @param executors Direcciones que pueden ejecutar operaciones listas.
     * @param admin Admin inicial para configuracion; en produccion puede renunciar.
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}