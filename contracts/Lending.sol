// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Lending
 * @dev Collateralized lending protocol with dynamic interest rates
 */
contract Lending is ReentrancyGuard, Pausable, Ownable {
    // Supported assets
    struct Asset {
        bool isSupported;
        uint256 collateralFactor; // e.g., 75% = 7500
        uint256 liquidationThreshold; // e.g., 80% = 8000
        uint256 liquidationPenalty; // e.g., 5% = 500
        uint256 baseRate; // Base interest rate per year
        uint256 multiplier; // Interest rate multiplier
        uint256 totalDeposits;
        uint256 totalBorrows;
        uint256 reserveFactor; // Protocol reserve
    }
    
    // User position
    struct UserPosition {
        uint256 deposited;
        uint256 borrowed;
        uint256 borrowIndex;
        uint256 lastUpdateTime;
    }
    
    // Price oracle interface
    interface IPriceOracle {
        function getPrice(address asset) external view returns (uint256);
    }
    
    // Constants
    uint256 public constant PRECISION = 10000;
    uint256 public constant SECONDS_PER_YEAR = 31536000;
    
    // State
    IPriceOracle public priceOracle;
    mapping(address => Asset) public assets;
    mapping(address => mapping(address => UserPosition)) public positions; // user => asset => position
    address[] public supportedAssets;
    
    // Interest rate model
    uint256 public optimalUtilization = 8000; // 80%
    uint256 public baseMultiplier = 200; // 2%
    uint256 public jumpMultiplier = 2000; // 20%
    
    // Events
    event Deposit(address indexed user, address indexed asset, uint256 amount);
    event Withdraw(address indexed user, address indexed asset, uint256 amount);
    event Borrow(address indexed user, address indexed asset, uint256 amount);
    event Repay(address indexed user, address indexed asset, uint256 amount);
    event Liquidation(
        address indexed liquidator,
        address indexed borrower,
        address indexed asset,
        uint256 debtRepaid,
        uint256 collateralSeized
    );
    event AssetAdded(address indexed asset);
    event AssetUpdated(address indexed asset);
    
    constructor(address _priceOracle) {
        priceOracle = IPriceOracle(_priceOracle);
    }
    
    // ============ Admin Functions ============
    
    function addAsset(
        address asset,
        uint256 collateralFactor,
        uint256 liquidationThreshold,
        uint256 liquidationPenalty,
        uint256 baseRate,
        uint256 reserveFactor
    ) external onlyOwner {
        require(!assets[asset].isSupported, "Asset already supported");
        
        assets[asset] = Asset({
            isSupported: true,
            collateralFactor: collateralFactor,
            liquidationThreshold: liquidationThreshold,
            liquidationPenalty: liquidationPenalty,
            baseRate: baseRate,
            multiplier: baseMultiplier,
            totalDeposits: 0,
            totalBorrows: 0,
            reserveFactor: reserveFactor
        });
        
        supportedAssets.push(asset);
        emit AssetAdded(asset);
    }
    
    function updateAsset(
        address asset,
        uint256 collateralFactor,
        uint256 liquidationThreshold,
        uint256 liquidationPenalty
    ) external onlyOwner {
        require(assets[asset].isSupported, "Asset not supported");
        
        Asset storage assetData = assets[asset];
        assetData.collateralFactor = collateralFactor;
        assetData.liquidationThreshold = liquidationThreshold;
        assetData.liquidationPenalty = liquidationPenalty;
        
        emit AssetUpdated(asset);
    }
    
    function setPriceOracle(address _priceOracle) external onlyOwner {
        priceOracle = IPriceOracle(_priceOracle);
    }
    
    // ============ Core Functions ============
    
    function deposit(address asset, uint256 amount) external nonReentrant whenNotPaused {
        require(assets[asset].isSupported, "Asset not supported");
        require(amount > 0, "Amount must be > 0");
        
        _accrueInterest(asset);
        
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        
        positions[msg.sender][asset].deposited += amount;
        assets[asset].totalDeposits += amount;
        
        emit Deposit(msg.sender, asset, amount);
    }
    
    function withdraw(address asset, uint256 amount) external nonReentrant {
        require(assets[asset].isSupported, "Asset not supported");
        
        _accrueInterest(asset);
        
        UserPosition storage position = positions[msg.sender][asset];
        require(position.deposited >= amount, "Insufficient balance");
        
        position.deposited -= amount;
        assets[asset].totalDeposits -= amount;
        
        // Check health factor after withdrawal
        require(getHealthFactor(msg.sender) >= PRECISION, "Would be undercollateralized");
        
        IERC20(asset).transfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, asset, amount);
    }
    
    function borrow(address asset, uint256 amount) external nonReentrant whenNotPaused {
        require(assets[asset].isSupported, "Asset not supported");
        require(amount > 0, "Amount must be > 0");
        
        _accrueInterest(asset);
        
        Asset storage assetData = assets[asset];
        require(assetData.totalDeposits - assetData.totalBorrows >= amount, "Insufficient liquidity");
        
        UserPosition storage position = positions[msg.sender][asset];
        position.borrowed += amount;
        position.lastUpdateTime = block.timestamp;
        assetData.totalBorrows += amount;
        
        // Check health factor after borrowing
        require(getHealthFactor(msg.sender) >= PRECISION, "Would be undercollateralized");
        
        IERC20(asset).transfer(msg.sender, amount);
        
        emit Borrow(msg.sender, asset, amount);
    }
    
    function repay(address asset, uint256 amount) external nonReentrant {
        require(assets[asset].isSupported, "Asset not supported");
        
        _accrueInterest(asset);
        
        UserPosition storage position = positions[msg.sender][asset];
        uint256 debt = position.borrowed;
        uint256 repayAmount = amount > debt ? debt : amount;
        
        IERC20(asset).transferFrom(msg.sender, address(this), repayAmount);
        
        position.borrowed -= repayAmount;
        assets[asset].totalBorrows -= repayAmount;
        
        emit Repay(msg.sender, asset, repayAmount);
    }
    
    function liquidate(
        address borrower,
        address collateralAsset,
        address debtAsset,
        uint256 debtAmount
    ) external nonReentrant {
        require(getHealthFactor(borrower) < PRECISION, "Cannot liquidate healthy position");
        
        _accrueInterest(collateralAsset);
        _accrueInterest(debtAsset);
        
        UserPosition storage debtPosition = positions[borrower][debtAsset];
        require(debtPosition.borrowed >= debtAmount, "Debt amount too high");
        
        // Calculate collateral to seize
        uint256 debtValue = debtAmount * priceOracle.getPrice(debtAsset) / 1e18;
        uint256 collateralPrice = priceOracle.getPrice(collateralAsset);
        uint256 liquidationBonus = PRECISION + assets[collateralAsset].liquidationPenalty;
        uint256 collateralToSeize = (debtValue * liquidationBonus * 1e18) / (collateralPrice * PRECISION);
        
        UserPosition storage collateralPosition = positions[borrower][collateralAsset];
        require(collateralPosition.deposited >= collateralToSeize, "Insufficient collateral");
        
        // Execute liquidation
        IERC20(debtAsset).transferFrom(msg.sender, address(this), debtAmount);
        
        debtPosition.borrowed -= debtAmount;
        assets[debtAsset].totalBorrows -= debtAmount;
        
        collateralPosition.deposited -= collateralToSeize;
        assets[collateralAsset].totalDeposits -= collateralToSeize;
        
        IERC20(collateralAsset).transfer(msg.sender, collateralToSeize);
        
        emit Liquidation(msg.sender, borrower, debtAsset, debtAmount, collateralToSeize);
    }
    
    // ============ Interest Functions ============
    
    function _accrueInterest(address asset) internal {
        Asset storage assetData = assets[asset];
        if (assetData.totalBorrows == 0) return;
        
        uint256 borrowRate = getBorrowRate(asset);
        uint256 interestAccrued = (assetData.totalBorrows * borrowRate) / SECONDS_PER_YEAR;
        
        uint256 reserveAmount = (interestAccrued * assetData.reserveFactor) / PRECISION;
        assetData.totalBorrows += interestAccrued - reserveAmount;
    }
    
    function getBorrowRate(address asset) public view returns (uint256) {
        Asset storage assetData = assets[asset];
        if (assetData.totalDeposits == 0) return assetData.baseRate;
        
        uint256 utilization = (assetData.totalBorrows * PRECISION) / assetData.totalDeposits;
        
        if (utilization <= optimalUtilization) {
            return assetData.baseRate + (utilization * baseMultiplier) / PRECISION;
        } else {
            uint256 excessUtilization = utilization - optimalUtilization;
            return assetData.baseRate + 
                   (optimalUtilization * baseMultiplier) / PRECISION +
                   (excessUtilization * jumpMultiplier) / PRECISION;
        }
    }
    
    function getSupplyRate(address asset) public view returns (uint256) {
        Asset storage assetData = assets[asset];
        if (assetData.totalDeposits == 0) return 0;
        
        uint256 utilization = (assetData.totalBorrows * PRECISION) / assetData.totalDeposits;
        uint256 borrowRate = getBorrowRate(asset);
        
        return (borrowRate * utilization * (PRECISION - assetData.reserveFactor)) / (PRECISION * PRECISION);
    }
    
    // ============ View Functions ============
    
    function getHealthFactor(address user) public view returns (uint256) {
        uint256 totalCollateralValue = 0;
        uint256 totalDebtValue = 0;
        
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            address asset = supportedAssets[i];
            UserPosition storage position = positions[user][asset];
            uint256 price = priceOracle.getPrice(asset);
            
            if (position.deposited > 0) {
                uint256 collateralValue = (position.deposited * price * assets[asset].collateralFactor) / (1e18 * PRECISION);
                totalCollateralValue += collateralValue;
            }
            
            if (position.borrowed > 0) {
                uint256 debtValue = (position.borrowed * price) / 1e18;
                totalDebtValue += debtValue;
            }
        }
        
        if (totalDebtValue == 0) return type(uint256).max;
        return (totalCollateralValue * PRECISION) / totalDebtValue;
    }
    
    function getUserPosition(address user, address asset) external view returns (
        uint256 deposited,
        uint256 borrowed,
        uint256 depositValue,
        uint256 borrowValue
    ) {
        UserPosition storage position = positions[user][asset];
        uint256 price = priceOracle.getPrice(asset);
        
        return (
            position.deposited,
            position.borrowed,
            (position.deposited * price) / 1e18,
            (position.borrowed * price) / 1e18
        );
    }
    
    function getAssetData(address asset) external view returns (
        uint256 totalDeposits,
        uint256 totalBorrows,
        uint256 utilization,
        uint256 borrowRate,
        uint256 supplyRate
    ) {
        Asset storage assetData = assets[asset];
        uint256 util = assetData.totalDeposits > 0 
            ? (assetData.totalBorrows * PRECISION) / assetData.totalDeposits 
            : 0;
        
        return (
            assetData.totalDeposits,
            assetData.totalBorrows,
            util,
            getBorrowRate(asset),
            getSupplyRate(asset)
        );
    }
    
    function getSupportedAssets() external view returns (address[] memory) {
        return supportedAssets;
    }
    
    // ============ Emergency Functions ============
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
