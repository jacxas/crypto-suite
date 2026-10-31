// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @dev Token con checkpoints de votos (ERC20Votes de OpenZeppelin).
interface IVotesToken {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function delegate(address delegatee) external;
    function getVotes(address account) external view returns (uint256);
}

/**
 * @title Governance
 * @dev DAO con propuestas, votacion y timelock.
 * @notice Implementado segun test/contracts/Governance.test.cjs.
 * @dev El poder de voto se lee de los checkpoints del token (`getVotes`), por lo
 *      que hay que delegar para que cuente. El quorum se expresa en porcentaje
 *      sobre el supply total.
 */
contract Governance is Ownable, ReentrancyGuard {
    enum VoteType {
        For,
        Against,
        Abstain
    }

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
    }

    struct Receipt {
        bool hasVoted;
        uint8 support;
        uint256 votes;
    }

    IERC20 public governanceToken;

    uint256 public votingDelay = 0;
    uint256 public votingPeriod;
    uint256 public timelockDelay;
    uint256 public quorumPercent;
    uint256 public proposalThreshold = 0;
    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Receipt)) public receipts;

    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(uint256 indexed id, address indexed voter, uint8 support, uint256 votes);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCancelled(uint256 indexed id);
    event VoteDelegated(address indexed delegator, address indexed delegatee);

    constructor(
        address _governanceToken,
        uint256 _votingPeriod,
        uint256 _timelockDelay,
        uint256 _quorumPercent
    ) Ownable(msg.sender) {
        require(_governanceToken != address(0), "Invalid token");
        governanceToken = IERC20(_governanceToken);
        votingPeriod = _votingPeriod;
        timelockDelay = _timelockDelay;
        quorumPercent = _quorumPercent;
    }

    // ==================== Votos ====================

    /// @notice Poder de voto actual, leido de los checkpoints del token.
    function getVotingPower(address account) public view returns (uint256) {
        return IVotesToken(address(governanceToken)).getVotes(account);
    }

    /// @notice Delega el poder de voto en el token subyacente.
    function delegate(address delegatee) external {
        IVotesToken(address(governanceToken)).delegate(delegatee);
        emit VoteDelegated(msg.sender, delegatee);
    }

    // ==================== Propuestas ====================

    function createProposal(
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external returns (uint256) {
        require(
            targets.length == values.length && targets.length == calldatas.length,
            "Length mismatch"
        );
        require(targets.length > 0, "Empty proposal");
        require(
            getVotingPower(msg.sender) > proposalThreshold,
            "Insufficient voting power"
        );

        proposalCount += 1;
        uint256 proposalId = proposalCount;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;
        proposal.startTime = block.timestamp + votingDelay;
        proposal.endTime = block.timestamp + votingDelay + votingPeriod;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            proposal.startTime,
            proposal.endTime
        );

        return proposalId;
    }

    function vote(uint256 proposalId, uint8 support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal not found");
        require(!proposal.canceled, "Proposal canceled");
        require(!proposal.executed, "Proposal executed");
        require(block.timestamp <= proposal.endTime, "Voting ended");

        Receipt storage receipt = receipts[proposalId][msg.sender];
        require(!receipt.hasVoted, "Already voted");

        uint256 votes = getVotingPower(msg.sender);
        require(votes > 0, "No voting power");

        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;

        if (support == uint8(VoteType.For)) {
            proposal.forVotes += votes;
        } else if (support == uint8(VoteType.Against)) {
            proposal.againstVotes += votes;
        } else {
            proposal.abstainVotes += votes;
        }

        emit VoteCast(proposalId, msg.sender, support, votes);
    }

    /// @notice Ejecuta la propuesta una vez terminada la votacion y el timelock.
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal not found");
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(
            block.timestamp >= proposal.endTime + timelockDelay,
            "Timelock not passed"
        );
        require(proposal.forVotes >= _quorumVotes(), "Quorum not reached");

        proposal.executed = true;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(
                proposal.calldatas[i]
            );
            require(success, "Execution failed");
        }

        emit ProposalExecuted(proposalId);
    }

    /// @notice Cancela una propuesta. Solo puede hacerlo quien la propuso.
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer == msg.sender, "Not proposer");
        require(!proposal.executed, "Already executed");

        proposal.canceled = true;

        emit ProposalCancelled(proposalId);
    }

    function _quorumVotes() internal view returns (uint256) {
        return (governanceToken.totalSupply() * quorumPercent) / 100;
    }

    // ==================== Administracion ====================

    function setVotingPeriod(uint256 _votingPeriod) external onlyOwner {
        votingPeriod = _votingPeriod;
    }

    function setTimelockDelay(uint256 _timelockDelay) external onlyOwner {
        timelockDelay = _timelockDelay;
    }

    function setQuorumPercent(uint256 _quorumPercent) external onlyOwner {
        quorumPercent = _quorumPercent;
    }

    function setProposalThreshold(uint256 _proposalThreshold) external onlyOwner {
        proposalThreshold = _proposalThreshold;
    }
}
