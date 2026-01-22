// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Governance
 * @dev DAO Governance contract with on-chain voting and timelock
 */
contract Governance is ReentrancyGuard, Ownable {
    IERC20 public governanceToken;
    
    // Proposal states
    enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed }
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool executed;
        uint256 eta; // Execution time after timelock
    }
    
    // Vote types
    enum VoteType { Against, For, Abstain }
    
    // Vote receipt
    struct Receipt {
        bool hasVoted;
        VoteType support;
        uint256 votes;
    }
    
    // Configuration
    uint256 public votingDelay = 1 days; // Time before voting starts
    uint256 public votingPeriod = 7 days; // Voting duration
    uint256 public proposalThreshold; // Min tokens to create proposal
    uint256 public quorumVotes; // Min votes for proposal to pass
    uint256 public timelockDelay = 2 days; // Delay before execution
    
    // State
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Receipt)) public receipts;
    mapping(address => uint256) public latestProposalIds;
    
    // Delegation
    mapping(address => address) public delegates;
    mapping(address => uint256) public delegatedVotes;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(address indexed voter, uint256 indexed proposalId, VoteType support, uint256 votes);
    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalQueued(uint256 indexed proposalId, uint256 eta);
    event ProposalExecuted(uint256 indexed proposalId);
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);
    
    constructor(
        address _governanceToken,
        uint256 _proposalThreshold,
        uint256 _quorumVotes
    ) {
        governanceToken = IERC20(_governanceToken);
        proposalThreshold = _proposalThreshold;
        quorumVotes = _quorumVotes;
    }
    
    // ============ Proposal Functions ============
    
    function propose(
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external returns (uint256) {
        require(
            getVotes(msg.sender) >= proposalThreshold,
            "Proposer votes below threshold"
        );
        require(
            targets.length == values.length && targets.length == calldatas.length,
            "Invalid proposal length"
        );
        require(targets.length > 0, "Empty proposal");
        
        uint256 proposalId = ++proposalCount;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;
        proposal.startTime = block.timestamp + votingDelay;
        proposal.endTime = proposal.startTime + votingPeriod;
        
        latestProposalIds[msg.sender] = proposalId;
        
        emit ProposalCreated(proposalId, msg.sender, title, proposal.startTime, proposal.endTime);
        
        return proposalId;
    }
    
    function castVote(uint256 proposalId, VoteType support) external nonReentrant {
        return _castVote(msg.sender, proposalId, support);
    }
    
    function _castVote(address voter, uint256 proposalId, VoteType support) internal {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = receipts[proposalId][voter];
        
        require(!receipt.hasVoted, "Already voted");
        
        uint256 votes = getVotes(voter);
        require(votes > 0, "No voting power");
        
        if (support == VoteType.For) {
            proposal.forVotes += votes;
        } else if (support == VoteType.Against) {
            proposal.againstVotes += votes;
        } else {
            proposal.abstainVotes += votes;
        }
        
        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;
        
        emit VoteCast(voter, proposalId, support, votes);
    }
    
    function queue(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not succeeded");
        
        Proposal storage proposal = proposals[proposalId];
        proposal.eta = block.timestamp + timelockDelay;
        
        emit ProposalQueued(proposalId, proposal.eta);
    }
    
    function execute(uint256 proposalId) external payable nonReentrant {
        require(state(proposalId) == ProposalState.Queued, "Proposal not queued");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.eta, "Timelock not expired");
        
        proposal.executed = true;
        
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(
                proposal.calldatas[i]
            );
            require(success, "Transaction execution failed");
        }
        
        emit ProposalExecuted(proposalId);
    }
    
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || getVotes(proposal.proposer) < proposalThreshold,
            "Cannot cancel"
        );
        require(!proposal.executed, "Already executed");
        
        proposal.canceled = true;
        
        emit ProposalCanceled(proposalId);
    }
    
    // ============ Delegation Functions ============
    
    function delegate(address delegatee) external {
        address currentDelegate = delegates[msg.sender];
        uint256 delegatorBalance = governanceToken.balanceOf(msg.sender);
        
        delegates[msg.sender] = delegatee;
        
        emit DelegateChanged(msg.sender, currentDelegate, delegatee);
        
        _moveDelegates(currentDelegate, delegatee, delegatorBalance);
    }
    
    function _moveDelegates(address srcRep, address dstRep, uint256 amount) internal {
        if (srcRep != address(0)) {
            uint256 srcRepOld = delegatedVotes[srcRep];
            uint256 srcRepNew = srcRepOld - amount;
            delegatedVotes[srcRep] = srcRepNew;
            emit DelegateVotesChanged(srcRep, srcRepOld, srcRepNew);
        }
        
        if (dstRep != address(0)) {
            uint256 dstRepOld = delegatedVotes[dstRep];
            uint256 dstRepNew = dstRepOld + amount;
            delegatedVotes[dstRep] = dstRepNew;
            emit DelegateVotesChanged(dstRep, dstRepOld, dstRepNew);
        }
    }
    
    // ============ View Functions ============
    
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.canceled) return ProposalState.Canceled;
        if (block.timestamp < proposal.startTime) return ProposalState.Pending;
        if (block.timestamp <= proposal.endTime) return ProposalState.Active;
        if (proposal.forVotes <= proposal.againstVotes || proposal.forVotes < quorumVotes) {
            return ProposalState.Defeated;
        }
        if (proposal.eta == 0) return ProposalState.Succeeded;
        if (proposal.executed) return ProposalState.Executed;
        if (block.timestamp >= proposal.eta + 14 days) return ProposalState.Expired;
        return ProposalState.Queued;
    }
    
    function getVotes(address account) public view returns (uint256) {
        address delegate_ = delegates[account];
        if (delegate_ == address(0)) {
            return governanceToken.balanceOf(account);
        }
        return delegatedVotes[account];
    }
    
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        ProposalState currentState
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            state(proposalId)
        );
    }
    
    function hasVoted(uint256 proposalId, address account) external view returns (bool) {
        return receipts[proposalId][account].hasVoted;
    }
    
    // ============ Admin Functions ============
    
    function setVotingDelay(uint256 _votingDelay) external onlyOwner {
        votingDelay = _votingDelay;
    }
    
    function setVotingPeriod(uint256 _votingPeriod) external onlyOwner {
        votingPeriod = _votingPeriod;
    }
    
    function setProposalThreshold(uint256 _proposalThreshold) external onlyOwner {
        proposalThreshold = _proposalThreshold;
    }
    
    function setQuorumVotes(uint256 _quorumVotes) external onlyOwner {
        quorumVotes = _quorumVotes;
    }
    
    function setTimelockDelay(uint256 _timelockDelay) external onlyOwner {
        timelockDelay = _timelockDelay;
    }
    
    receive() external payable {}
}
