// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockPriceOracle
/// @notice Oraculo de precios controlable para los tests.
/// @dev La firma de `getPrice` coincide con la interfaz IPriceOracle que
///      declara Lending.sol. Los precios se expresan con 18 decimales.
contract MockPriceOracle {
    mapping(address => uint256) private _prices;

    event PriceSet(address indexed asset, uint256 price);

    /// @notice Fija el precio de un activo (solo para tests).
    function setPrice(address asset, uint256 price) external {
        _prices[asset] = price;
        emit PriceSet(asset, price);
    }

    /// @notice Devuelve el precio del activo, en unidades de 18 decimales.
    function getPrice(address asset) external view returns (uint256) {
        return _prices[asset];
    }
}
