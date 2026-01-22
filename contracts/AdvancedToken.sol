// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title AdvancedToken
 * @dev ERC20 token with staking, auto-compound, and fee mechanism
 * @notice Includes ReentrancyGuard and Pausable for security
 */
contract AdvancedToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public stakingTimestamp;
    mapping(address => uint256) public lastClaimTime;
    
    uint256 public totalStaked;
    uint256 public rewardPool;
    uint256 public constant FEE_PERCENT = 1;
    uint256 public minStakeDuration = 1 days;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event AutoCompounded(uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }

    function transfer(address recipient, uint256 amount) public override whenNotPaused returns (bool) {
        uint256 fee = (amount * FEE_PERCENT) / 100;
        uint256 netAmount = amount - fee;
        rewardPool += fee;
        _transfer(_msgSender(), recipient, netAmount);
        return true;
    }

    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        if (stakingBalance[msg.sender] > 0) {
            _claimRewards(msg.sender);
        }
        
        _transfer(msg.sender, address(this), amount);
        stakingBalance[msg.sender] += amount;
        totalStaked += amount;
        stakingTimestamp[msg.sender] = block.timestamp;
        lastClaimTime[msg.sender] = block.timestamp;
        
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(stakingBalance[msg.sender] >= amount, "Insufficient staked balance");
        require(block.timestamp >= stakingTimestamp[msg.sender] + minStakeDuration, "Min stake duration not met");
        
        _claimRewards(msg.sender);
        
        stakingBalance[msg.sender] -= amount;
        totalStaked -= amount;
        _transfer(address(this), msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    function claimRewards() external nonReentrant {
        require(stakingBalance[msg.sender] > 0, "No staked balance");
        _claimRewards(msg.sender);
    }
    
    function _claimRewards(address user) internal {
        uint256 rewards = calculateRewards(user);
        if (rewards > 0 && rewards <= rewardPool) {
            rewardPool -= rewards;
            _mint(user, rewards);
            lastClaimTime[user] = block.timestamp;
            emit RewardsClaimed(user, rewards);
        }
    }

    function calculateRewards(address user) public view returns (uint256) {
        if (stakingBalance[user] == 0 || totalStaked == 0) return 0;
        uint256 timeStaked = block.timestamp - lastClaimTime[user];
        uint256 baseReward = (stakingBalance[user] * timeStaked * 1) / (100 * 1 days);
        uint256 poolShare = (stakingBalance[user] * rewardPool) / totalStaked;
        return baseReward + poolShare;
    }

    function autoCompound() external onlyOwner nonReentrant {
        require(rewardPool > 0, "No rewards to compound");
        uint256 compoundAmount = rewardPool / 2;
        rewardPool -= compoundAmount;
        _mint(address(this), compoundAmount);
        totalStaked += compoundAmount;
        emit AutoCompounded(compoundAmount);
    }
    
    function emergencyWithdraw() external nonReentrant {
        uint256 amount = stakingBalance[msg.sender];
        require(amount > 0, "No staked balance");
        stakingBalance[msg.sender] = 0;
        totalStaked -= amount;
        _transfer(address(this), msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    function setMinStakeDuration(uint256 _duration) external onlyOwner {
        minStakeDuration = _duration;
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}