// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MultiContract
 * @dev A versatile multi-purpose contract that handles multiple operations:
 * - Token staking and rewards
 * - NFT escrow and trading
 * - Multi-signature operations
 * - Time-locked transactions
 */
contract MultiContract is Ownable, ReentrancyGuard, Pausable {
    
    // ============ State Variables ============
    
    IERC20 public rewardToken;
    
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        bool active;
    }
    
    struct NFTEscrow {
        address nftContract;
        uint256 tokenId;
        address seller;
        address buyer;
        uint256 price;
        bool completed;
        uint256 deadline;
    }
    
    struct TimeLock {
        address recipient;
        uint256 amount;
        uint256 releaseTime;
        bool executed;
    }
    
    struct MultiSigTransaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }
    
    // Mappings
    mapping(address => Stake) public stakes;
    mapping(uint256 => NFTEscrow) public escrows;
    mapping(uint256 => TimeLock) public timeLocks;
    mapping(uint256 => MultiSigTransaction) public multiSigTxs;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(address => bool) public signers;
    
    // Counters
    uint256 public escrowCounter;
    uint256 public timeLockCounter;
    uint256 public multiSigTxCounter;
    
    // Configuration
    uint256 public rewardRate = 100; // 1% per day (100 basis points)
    uint256 public constant RATE_DENOMINATOR = 10000;
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public requiredConfirmations = 2;
    uint256 public totalStaked;
    
    address[] public signersList;
    
    // ============ Events ============
    
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event EscrowCreated(uint256 indexed escrowId, address indexed seller, address nftContract, uint256 tokenId, uint256 price);
    event EscrowCompleted(uint256 indexed escrowId, address indexed buyer);
    event EscrowCancelled(uint256 indexed escrowId);
    event TimeLockCreated(uint256 indexed lockId, address indexed recipient, uint256 amount, uint256 releaseTime);
    event TimeLockExecuted(uint256 indexed lockId, address indexed recipient, uint256 amount);
    event MultiSigTxSubmitted(uint256 indexed txId, address indexed submitter);
    event MultiSigTxConfirmed(uint256 indexed txId, address indexed signer);
    event MultiSigTxExecuted(uint256 indexed txId);
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    
    // ============ Constructor ============
    
    constructor(address _rewardToken) {
        rewardToken = IERC20(_rewardToken);
        signers[msg.sender] = true;
        signersList.push(msg.sender);
    }
    
    // ============ Staking Functions ============
    
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(rewardToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        Stake storage userStake = stakes[msg.sender];
        
        if (userStake.active) {
            // Claim pending rewards before adding more stake
            _claimRewards(msg.sender);
            userStake.amount += amount;
        } else {
            userStake.amount = amount;
            userStake.startTime = block.timestamp;
            userStake.lastClaimTime = block.timestamp;
            userStake.active = true;
        }
        
        totalStaked += amount;
        emit Staked(msg.sender, amount, block.timestamp);
    }
    
    function unstake(uint256 amount) external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.active, "No active stake");
        require(userStake.amount >= amount, "Insufficient stake");
        
        // Claim pending rewards
        _claimRewards(msg.sender);
        
        userStake.amount -= amount;
        totalStaked -= amount;
        
        if (userStake.amount == 0) {
            userStake.active = false;
        }
        
        require(rewardToken.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount, block.timestamp);
    }
    
    function claimRewards() external nonReentrant {
        _claimRewards(msg.sender);
    }
    
    function _claimRewards(address user) internal {
        Stake storage userStake = stakes[user];
        require(userStake.active, "No active stake");
        
        uint256 rewards = calculateRewards(user);
        if (rewards > 0) {
            userStake.lastClaimTime = block.timestamp;
            require(rewardToken.transfer(user, rewards), "Reward transfer failed");
            emit RewardsClaimed(user, rewards, block.timestamp);
        }
    }
    
    function calculateRewards(address user) public view returns (uint256) {
        Stake memory userStake = stakes[user];
        if (!userStake.active) return 0;
        
        uint256 timeStaked = block.timestamp - userStake.lastClaimTime;
        uint256 rewards = (userStake.amount * rewardRate * timeStaked) / (RATE_DENOMINATOR * SECONDS_PER_DAY);
        return rewards;
    }
    
    // ============ NFT Escrow Functions ============
    
    function createEscrow(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 duration
    ) external nonReentrant whenNotPaused returns (uint256) {
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this), "Not approved");
        
        uint256 escrowId = escrowCounter++;
        escrows[escrowId] = NFTEscrow({
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            buyer: address(0),
            price: price,
            completed: false,
            deadline: block.timestamp + duration
        });
        
        nft.transferFrom(msg.sender, address(this), tokenId);
        emit EscrowCreated(escrowId, msg.sender, nftContract, tokenId, price);
        return escrowId;
    }
    
    function completeEscrow(uint256 escrowId) external payable nonReentrant {
        NFTEscrow storage escrow = escrows[escrowId];
        require(!escrow.completed, "Already completed");
        require(block.timestamp <= escrow.deadline, "Escrow expired");
        require(msg.value >= escrow.price, "Insufficient payment");
        
        escrow.buyer = msg.sender;
        escrow.completed = true;
        
        IERC721 nft = IERC721(escrow.nftContract);
        nft.transferFrom(address(this), msg.sender, escrow.tokenId);
        
        payable(escrow.seller).transfer(escrow.price);
        
        if (msg.value > escrow.price) {
            payable(msg.sender).transfer(msg.value - escrow.price);
        }
        
        emit EscrowCompleted(escrowId, msg.sender);
    }
    
    function cancelEscrow(uint256 escrowId) external nonReentrant {
        NFTEscrow storage escrow = escrows[escrowId];
        require(escrow.seller == msg.sender, "Not seller");
        require(!escrow.completed, "Already completed");
        require(block.timestamp > escrow.deadline, "Escrow not expired");
        
        IERC721 nft = IERC721(escrow.nftContract);
        nft.transferFrom(address(this), escrow.seller, escrow.tokenId);
        
        escrow.completed = true;
        emit EscrowCancelled(escrowId);
    }
    
    // ============ Time Lock Functions ============
    
    function createTimeLock(address recipient, uint256 releaseTime) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "Amount must be greater than 0");
        require(releaseTime > block.timestamp, "Release time must be in future");
        
        uint256 lockId = timeLockCounter++;
        timeLocks[lockId] = TimeLock({
            recipient: recipient,
            amount: msg.value,
            releaseTime: releaseTime,
            executed: false
        });
        
        emit TimeLockCreated(lockId, recipient, msg.value, releaseTime);
        return lockId;
    }
    
    function executeTimeLock(uint256 lockId) external nonReentrant {
        TimeLock storage lock = timeLocks[lockId];
        require(!lock.executed, "Already executed");
        require(block.timestamp >= lock.releaseTime, "Not yet unlocked");
        require(msg.sender == lock.recipient, "Not recipient");
        
        lock.executed = true;
        payable(lock.recipient).transfer(lock.amount);
        
        emit TimeLockExecuted(lockId, lock.recipient, lock.amount);
    }
    
    // ============ Multi-Signature Functions ============
    
    function addSigner(address signer) external onlyOwner {
        require(!signers[signer], "Already a signer");
        signers[signer] = true;
        signersList.push(signer);
        emit SignerAdded(signer);
    }
    
    function removeSigner(address signer) external onlyOwner {
        require(signers[signer], "Not a signer");
        require(signersList.length > requiredConfirmations, "Cannot remove, would break confirmations");
        
        signers[signer] = false;
        
        for (uint256 i = 0; i < signersList.length; i++) {
            if (signersList[i] == signer) {
                signersList[i] = signersList[signersList.length - 1];
                signersList.pop();
                break;
            }
        }
        
        emit SignerRemoved(signer);
    }
    
    function submitMultiSigTx(address to, uint256 value, bytes memory data) external returns (uint256) {
        require(signers[msg.sender], "Not a signer");
        
        uint256 txId = multiSigTxCounter++;
        multiSigTxs[txId] = MultiSigTransaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            confirmations: 0
        });
        
        emit MultiSigTxSubmitted(txId, msg.sender);
        confirmMultiSigTx(txId);
        return txId;
    }
    
    function confirmMultiSigTx(uint256 txId) public {
        require(signers[msg.sender], "Not a signer");
        require(!confirmations[txId][msg.sender], "Already confirmed");
        require(!multiSigTxs[txId].executed, "Already executed");
        
        confirmations[txId][msg.sender] = true;
        multiSigTxs[txId].confirmations++;
        
        emit MultiSigTxConfirmed(txId, msg.sender);
        
        if (multiSigTxs[txId].confirmations >= requiredConfirmations) {
            executeMultiSigTx(txId);
        }
    }
    
    function executeMultiSigTx(uint256 txId) internal {
        MultiSigTransaction storage transaction = multiSigTxs[txId];
        require(!transaction.executed, "Already executed");
        require(transaction.confirmations >= requiredConfirmations, "Not enough confirmations");
        
        transaction.executed = true;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction execution failed");
        
        emit MultiSigTxExecuted(txId);
    }
    
    // ============ Admin Functions ============
    
    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Rate too high"); // Max 10% per day
        rewardRate = newRate;
    }
    
    function setRequiredConfirmations(uint256 newRequired) external onlyOwner {
        require(newRequired > 0 && newRequired <= signersList.length, "Invalid confirmation count");
        requiredConfirmations = newRequired;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    // ============ View Functions ============
    
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lastClaimTime,
        uint256 pendingRewards,
        bool active
    ) {
        Stake memory userStake = stakes[user];
        return (
            userStake.amount,
            userStake.startTime,
            userStake.lastClaimTime,
            calculateRewards(user),
            userStake.active
        );
    }
    
    function getEscrowInfo(uint256 escrowId) external view returns (
        address nftContract,
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 price,
        bool completed,
        uint256 deadline
    ) {
        NFTEscrow memory escrow = escrows[escrowId];
        return (
            escrow.nftContract,
            escrow.tokenId,
            escrow.seller,
            escrow.buyer,
            escrow.price,
            escrow.completed,
            escrow.deadline
        );
    }
    
    function getSigners() external view returns (address[] memory) {
        return signersList;
    }
    
    receive() external payable {}
}
