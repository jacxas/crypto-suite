// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPriceOracle {
    function getPrice(address asset) external view returns (uint256);
}

/**
 * @title Lending
 * @dev Protocolo de prestamos con colateral, tasa dinamica y liquidaciones.
 * @notice Implementado segun test/contracts/Lending.test.cjs.
 * @dev Los factores y tasas se expresan en PORCENTAJE (75 = 75%, 2 = 2%),
 *      tal y como los pasa la especificacion.
 */
contract Lending is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Market {
        bool isListed;
        uint256 collateralFactor;      // %  (75 = 75%)
        uint256 liquidationThreshold;  // %  (80 = 80%)
        uint256 liquidationPenalty;    // %  (5 = 5%)
        uint256 baseRate;              // % anual con utilizacion 0
        uint256 rateSlope;             // pendiente de la curva de tipos
        uint256 totalSupply;
        uint256 totalBorrows;
    }

    struct UserPosition {
        uint256 supplied;
        uint256 borrowed;
    }

    /// @dev Escala de precios y del health factor (1e18 = 1.0).
    uint256 public constant PRECISION = 1e18;
    /// @dev Escala de los porcentajes.
    uint256 public constant PERCENT = 100;

    IPriceOracle public priceOracle;

    mapping(address => Market) public markets;
    mapping(address => mapping(address => UserPosition)) public userPositions;
    address[] public supportedAssets;

    event MarketCreated(address indexed asset, uint256 collateralFactor, uint256 liquidationThreshold, uint256 baseRate);
    event Supply(address indexed user, address indexed asset, uint256 amount);
    event Withdraw(address indexed user, address indexed asset, uint256 amount);
    event Borrow(address indexed user, address indexed asset, uint256 amount);
    event Repay(address indexed user, address indexed asset, uint256 amount);
    event Liquidation(
        address indexed liquidator,
        address indexed user,
        address collateralAsset,
        address borrowAsset,
        uint256 amountRepaid,
        uint256 collateralSeized
    );

    constructor(address _priceOracle) Ownable(msg.sender) {
        priceOracle = IPriceOracle(_priceOracle);
    }

    // ==================== Mercados ====================

    function createMarket(
        address asset,
        uint256 collateralFactor,
        uint256 liquidationThreshold,
        uint256 baseRate
    ) external onlyOwner {
        require(asset != address(0), "Invalid asset");
        require(!markets[asset].isListed, "Market exists");
        require(collateralFactor > 0 && collateralFactor <= PERCENT, "Invalid collateral factor");
        require(
            liquidationThreshold > 0 && liquidationThreshold <= PERCENT,
            "Invalid liquidation threshold"
        );

        Market storage market = markets[asset];
        market.isListed = true;
        market.collateralFactor = collateralFactor;
        market.liquidationThreshold = liquidationThreshold;
        market.liquidationPenalty = 5;
        market.baseRate = baseRate;
        market.rateSlope = 50;

        supportedAssets.push(asset);

        emit MarketCreated(asset, collateralFactor, liquidationThreshold, baseRate);
    }

    function setPriceOracle(address _priceOracle) external onlyOwner {
        priceOracle = IPriceOracle(_priceOracle);
    }

    function getSupportedAssets() external view returns (address[] memory) {
        return supportedAssets;
    }

    // ==================== Operaciones ====================

    function supply(address asset, uint256 amount) external nonReentrant {
        Market storage market = markets[asset];
        require(market.isListed, "Market not found");
        require(amount > 0, "Amount must be > 0");

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        userPositions[msg.sender][asset].supplied += amount;
        market.totalSupply += amount;

        emit Supply(msg.sender, asset, amount);
    }

    function withdraw(address asset, uint256 amount) external nonReentrant {
        Market storage market = markets[asset];
        require(market.isListed, "Market not found");

        UserPosition storage position = userPositions[msg.sender][asset];
        require(position.supplied >= amount, "Insufficient balance");

        position.supplied -= amount;
        market.totalSupply -= amount;

        // No se puede retirar colateral dejando la posicion sin salud.
        require(_healthFactor(msg.sender) >= PRECISION, "Insufficient collateral");

        IERC20(asset).safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, asset, amount);
    }

    function borrow(address asset, uint256 amount) external nonReentrant {
        Market storage market = markets[asset];
        require(market.isListed, "Market not found");
        require(amount > 0, "Amount must be > 0");
        require(
            market.totalSupply - market.totalBorrows >= amount,
            "Insufficient liquidity"
        );

        UserPosition storage position = userPositions[msg.sender][asset];
        position.borrowed += amount;
        market.totalBorrows += amount;

        require(_debtValue(msg.sender) <= _maxBorrowValue(msg.sender), "Insufficient collateral");

        IERC20(asset).safeTransfer(msg.sender, amount);

        emit Borrow(msg.sender, asset, amount);
    }

    function repay(address asset, uint256 amount) external nonReentrant {
        Market storage market = markets[asset];
        require(market.isListed, "Market not found");

        UserPosition storage position = userPositions[msg.sender][asset];
        uint256 debt = position.borrowed;
        require(debt > 0, "No debt");

        uint256 repayAmount = amount == type(uint256).max ? debt : amount;
        if (repayAmount > debt) {
            repayAmount = debt;
        }

        IERC20(asset).safeTransferFrom(msg.sender, address(this), repayAmount);

        position.borrowed -= repayAmount;
        market.totalBorrows -= repayAmount;

        emit Repay(msg.sender, asset, repayAmount);
    }

    /// @notice Liquida una posicion sin salud.
    function liquidate(
        address user,
        address collateralAsset,
        address borrowAsset,
        uint256 amount
    ) external nonReentrant {
        require(_healthFactor(user) < PRECISION, "Position is healthy");

        UserPosition storage debt = userPositions[user][borrowAsset];
        UserPosition storage collateral = userPositions[user][collateralAsset];

        require(amount > 0 && amount <= debt.borrowed, "Invalid amount");

        uint256 priceCollateral = priceOracle.getPrice(collateralAsset);
        uint256 priceBorrow = priceOracle.getPrice(borrowAsset);
        require(priceCollateral > 0 && priceBorrow > 0, "Invalid price");

        Market storage borrowMarket = markets[borrowAsset];
        Market storage collateralMarket = markets[collateralAsset];

        uint256 repayValue = (amount * priceBorrow) / PRECISION;
        uint256 seizeValue = (repayValue * (PERCENT + collateralMarket.liquidationPenalty)) / PERCENT;
        uint256 seizeAmount = (seizeValue * PRECISION) / priceCollateral;

        require(seizeAmount <= collateral.supplied, "Insufficient collateral");

        IERC20(borrowAsset).safeTransferFrom(msg.sender, address(this), amount);

        debt.borrowed -= amount;
        borrowMarket.totalBorrows -= amount;

        collateral.supplied -= seizeAmount;
        collateralMarket.totalSupply -= seizeAmount;

        IERC20(collateralAsset).safeTransfer(msg.sender, seizeAmount);

        emit Liquidation(msg.sender, user, collateralAsset, borrowAsset, amount, seizeAmount);
    }

    // ==================== Vistas ====================

    /// @notice Tasa de interes anual (%) segun la utilizacion del mercado.
    function getInterestRate(address asset) external view returns (uint256) {
        Market storage market = markets[asset];
        if (market.totalSupply == 0) {
            return market.baseRate;
        }
        uint256 utilization = (market.totalBorrows * PERCENT) / market.totalSupply;
        return market.baseRate + ((utilization * market.rateSlope) / PERCENT);
    }

    /// @notice 1e18 = 1.0. Por debajo de 1e18 la posicion es liquidable.
    function getHealthFactor(address user) external view returns (uint256) {
        return _healthFactor(user);
    }

    function _healthFactor(address user) internal view returns (uint256) {
        uint256 debtValue = _debtValue(user);
        if (debtValue == 0) {
            return type(uint256).max;
        }
        return (_weightedCollateralValue(user) * PRECISION) / debtValue;
    }

    function _debtValue(address user) internal view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            address asset = supportedAssets[i];
            uint256 borrowed = userPositions[user][asset].borrowed;
            if (borrowed > 0) {
                total += (borrowed * priceOracle.getPrice(asset)) / PRECISION;
            }
        }
        return total;
    }

    /// @dev Colateral valorado con el umbral de liquidacion de cada activo.
    function _weightedCollateralValue(address user) internal view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            address asset = supportedAssets[i];
            uint256 supplied = userPositions[user][asset].supplied;
            if (supplied > 0) {
                uint256 value = (supplied * priceOracle.getPrice(asset)) / PRECISION;
                total += (value * markets[asset].liquidationThreshold) / PERCENT;
            }
        }
        return total;
    }

    function _maxBorrowValue(address user) internal view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            address asset = supportedAssets[i];
            uint256 supplied = userPositions[user][asset].supplied;
            if (supplied > 0) {
                uint256 value = (supplied * priceOracle.getPrice(asset)) / PRECISION;
                total += (value * markets[asset].collateralFactor) / PERCENT;
            }
        }
        return total;
    }
}
