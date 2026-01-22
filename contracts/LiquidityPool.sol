// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LiquidityPool
 * @dev Yield Farming and Liquidity Pool contract with dynamic APY
 */
contract LiquidityPool is ERC20, ReentrancyGuard, Pausable, Ownable {
    IERC20 public tokenA;
    IERC20 public tokenB;
    IERC20 public rewardToken;
    
    uint256 public totalLiquidity;
    uint256 public rewardRate; // Rewards per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public constant PRECISION = 1e18;
    
    // Fee configuration
    uint256 public swapFee = 30; // 0.3%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // User info
    struct UserInfo {
        uint256 liquidityProvided;
        uint256 rewardDebt;
        uint256 pendingRewards;
        uint256 depositTime;
    }
    
    mapping(address => UserInfo) public userInfo;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    
    // Events
    event LiquidityAdded(address indexed user, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(address indexed user, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event FeesCollected(uint256 amount);
    
    constructor(
        address _tokenA,
        address _tokenB,
        address _rewardToken,
        string memory _lpName,
        string memory _lpSymbol
    ) ERC20(_lpName, _lpSymbol) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        rewardToken = IERC20(_rewardToken);
        rewardRate = 1e16; // Default: 0.01 tokens per second
    }
    
    // ============ Modifiers ============
    
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }
    
    // ============ View Functions ============
    
    function rewardPerToken() public view returns (uint256) {
        if (totalLiquidity == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + 
            ((block.timestamp - lastUpdateTime) * rewardRate * PRECISION) / totalLiquidity;
    }
    
    function earned(address account) public view returns (uint256) {
        UserInfo storage user = userInfo[account];
        return (user.liquidityProvided * (rewardPerToken() - userRewardPerTokenPaid[account])) / PRECISION + rewards[account];
    }
    
    function getAPY() public view returns (uint256) {
        if (totalLiquidity == 0) return 0;
        // APY = (rewardRate * seconds_per_year * 100) / totalLiquidity
        return (rewardRate * 31536000 * 100 * PRECISION) / totalLiquidity;
    }
    
    function getReserves() public view returns (uint256 reserveA, uint256 reserveB) {
        reserveA = tokenA.balanceOf(address(this));
        reserveB = tokenB.balanceOf(address(this));
    }
    
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public view returns (uint256) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - swapFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        return numerator / denominator;
    }
    
    // ============ Liquidity Functions ============
    
    function addLiquidity(
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant whenNotPaused updateReward(msg.sender) returns (uint256 liquidity) {
        require(amountA > 0 && amountB > 0, "Amounts must be > 0");
        
        (uint256 reserveA, uint256 reserveB) = getReserves();
        
        // Transfer tokens
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);
        
        // Calculate liquidity tokens to mint
        if (totalLiquidity == 0) {
            liquidity = sqrt(amountA * amountB);
        } else {
            liquidity = min(
                (amountA * totalSupply()) / reserveA,
                (amountB * totalSupply()) / reserveB
            );
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        
        // Update state
        _mint(msg.sender, liquidity);
        totalLiquidity += liquidity;
        userInfo[msg.sender].liquidityProvided += liquidity;
        userInfo[msg.sender].depositTime = block.timestamp;
        
        emit LiquidityAdded(msg.sender, amountA, amountB, liquidity);
    }
    
    function removeLiquidity(
        uint256 liquidity
    ) external nonReentrant updateReward(msg.sender) returns (uint256 amountA, uint256 amountB) {
        require(liquidity > 0, "Liquidity must be > 0");
        require(balanceOf(msg.sender) >= liquidity, "Insufficient LP tokens");
        
        (uint256 reserveA, uint256 reserveB) = getReserves();
        uint256 totalSupplyLP = totalSupply();
        
        // Calculate amounts to return
        amountA = (liquidity * reserveA) / totalSupplyLP;
        amountB = (liquidity * reserveB) / totalSupplyLP;
        
        require(amountA > 0 && amountB > 0, "Insufficient liquidity burned");
        
        // Update state
        _burn(msg.sender, liquidity);
        totalLiquidity -= liquidity;
        userInfo[msg.sender].liquidityProvided -= liquidity;
        
        // Transfer tokens back
        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);
        
        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidity);
    }
    
    // ============ Swap Functions ============
    
    function swapAForB(uint256 amountIn) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be > 0");
        
        (uint256 reserveA, uint256 reserveB) = getReserves();
        amountOut = getAmountOut(amountIn, reserveA, reserveB);
        
        tokenA.transferFrom(msg.sender, address(this), amountIn);
        tokenB.transfer(msg.sender, amountOut);
        
        emit Swap(msg.sender, address(tokenA), amountIn, amountOut);
    }
    
    function swapBForA(uint256 amountIn) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be > 0");
        
        (uint256 reserveA, uint256 reserveB) = getReserves();
        amountOut = getAmountOut(amountIn, reserveB, reserveA);
        
        tokenB.transferFrom(msg.sender, address(this), amountIn);
        tokenA.transfer(msg.sender, amountOut);
        
        emit Swap(msg.sender, address(tokenB), amountIn, amountOut);
    }
    
    // ============ Reward Functions ============
    
    function claimRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        rewards[msg.sender] = 0;
        rewardToken.transfer(msg.sender, reward);
        
        emit RewardsClaimed(msg.sender, reward);
    }
    
    // ============ Admin Functions ============
    
    function setRewardRate(uint256 _rewardRate) external onlyOwner updateReward(address(0)) {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }
    
    function setSwapFee(uint256 _swapFee) external onlyOwner {
        require(_swapFee <= 1000, "Fee too high"); // Max 10%
        swapFee = _swapFee;
    }
    
    function depositRewards(uint256 amount) external onlyOwner {
        rewardToken.transferFrom(msg.sender, address(this), amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
    
    // ============ Helper Functions ============
    
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
