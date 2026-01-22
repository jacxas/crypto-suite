// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AdvancedToken is ERC20, Ownable {
    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public stakingTimestamp;
    uint256 public totalStaked;
    uint256 public rewardPool;
    uint256 public constant FEE_PERCENT = 1; // 1% fee on transfers

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event AutoCompounded(uint256 amount);

    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        uint256 fee = (amount * FEE_PERCENT) / 100;
        uint256 netAmount = amount - fee;
        rewardPool += fee;
        _transfer(_msgSender(), recipient, netAmount);
        return true;
    }

    function stake(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transfer(msg.sender, address(this), amount);
        stakingBalance[msg.sender] += amount;
        totalStaked += amount;
        stakingTimestamp[msg.sender] = block.timestamp;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        require(stakingBalance[msg.sender] >= amount, "Insufficient staked balance");
        stakingBalance[msg.sender] -= amount;
        totalStaked -= amount;
        _transfer(address(this), msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function calculateRewards(address user) external view returns (uint256) {
        if (stakingBalance[user] == 0) return 0;
        uint256 timeStaked = block.timestamp - stakingTimestamp[user];
        uint256 baseReward = (stakingBalance[user] * timeStaked * 1) / (100 * 1 days);
        uint256 poolShare = (stakingBalance[user] * rewardPool) / totalStaked;
        return baseReward + poolShare;
    }

    function autoCompound() external onlyOwner {
        uint256 compoundAmount = rewardPool / 2; // Compound half the pool
        rewardPool -= compoundAmount;
        _mint(address(this), compoundAmount);
        totalStaked += compoundAmount;
        emit AutoCompounded(compoundAmount);
    }
}