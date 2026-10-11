// Tests for Governance.sol
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

describe('Governance', function () {
  let governance;
  let token;
  let owner, user1, user2, user3;

  const VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days
  const TIMELOCK_DELAY = 2 * 24 * 60 * 60; // 2 days
  const QUORUM = 10; // 10%

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy governance token
    const MockToken = await ethers.getContractFactory('MockERC20Votes');
    token = await MockToken.deploy('Governance Token', 'GOV', ethers.parseEther('1000000'));

    // Deploy Governance
    const Governance = await ethers.getContractFactory('Governance');
    governance = await Governance.deploy(
      await token.getAddress(),
      VOTING_PERIOD,
      TIMELOCK_DELAY,
      QUORUM
    );

    // Distribute tokens
    await token.transfer(user1.address, ethers.parseEther('100000'));
    await token.transfer(user2.address, ethers.parseEther('100000'));
    await token.transfer(user3.address, ethers.parseEther('50000'));

    // Delegate to self
    await token.connect(user1).delegate(user1.address);
    await token.connect(user2).delegate(user2.address);
  });

  describe('Proposal Creation', function () {
    it('should create a proposal', async function () {
      await governance.connect(user1).createProposal(
        'Test Proposal',
        'This is a test proposal description',
        [owner.address],
        [0],
        ['0x']
      );

      const proposal = await governance.proposals(1);
      expect(proposal.title).to.equal('Test Proposal');
      expect(proposal.proposer).to.equal(user1.address);
    });

    it('should emit ProposalCreated event', async function () {
      await expect(
        governance.connect(user1).createProposal(
          'Test Proposal',
          'Description',
          [owner.address],
          [0],
          ['0x']
        )
      ).to.emit(governance, 'ProposalCreated');
    });

    it('should revert if user has no voting power', async function () {
      await expect(
        governance.connect(user3).createProposal(
          'Test Proposal',
          'Description',
          [owner.address],
          [0],
          ['0x']
        )
      ).to.be.revertedWith('Insufficient voting power');
    });
  });

  describe('Voting', function () {
    beforeEach(async function () {
      await governance.connect(user1).createProposal(
        'Test Proposal',
        'Description',
        [owner.address],
        [0],
        ['0x']
      );
    });

    it('should cast vote FOR', async function () {
      await governance.connect(user1).vote(1, 0); // 0 = For

      const proposal = await governance.proposals(1);
      expect(proposal.forVotes).to.be.gt(0);
    });

    it('should cast vote AGAINST', async function () {
      await governance.connect(user2).vote(1, 1); // 1 = Against

      const proposal = await governance.proposals(1);
      expect(proposal.againstVotes).to.be.gt(0);
    });

    it('should not allow double voting', async function () {
      await governance.connect(user1).vote(1, 0);

      await expect(
        governance.connect(user1).vote(1, 0)
      ).to.be.revertedWith('Already voted');
    });

    it('should not allow voting after period ends', async function () {
      await time.increase(VOTING_PERIOD + 1);

      await expect(
        governance.connect(user1).vote(1, 0)
      ).to.be.revertedWith('Voting ended');
    });
  });

  describe('Delegation', function () {
    it('should delegate votes', async function () {
      await token.connect(user3).delegate(user1.address);

      const votingPower = await governance.getVotingPower(user1.address);
      expect(votingPower).to.be.gt(ethers.parseEther('100000'));
    });

    it('should emit VoteDelegated event', async function () {
      await expect(
        governance.connect(user3).delegate(user1.address)
      ).to.emit(governance, 'VoteDelegated');
    });
  });

  describe('Proposal Execution', function () {
    beforeEach(async function () {
      await governance.connect(user1).createProposal(
        'Test Proposal',
        'Description',
        [owner.address],
        [0],
        ['0x']
      );

      // Vote to pass
      await governance.connect(user1).vote(1, 0);
      await governance.connect(user2).vote(1, 0);
    });

    it('should not execute before voting ends', async function () {
      await expect(
        governance.executeProposal(1)
      ).to.be.revertedWith('Voting not ended');
    });

    it('should not execute before timelock', async function () {
      await time.increase(VOTING_PERIOD + 1);

      await expect(
        governance.executeProposal(1)
      ).to.be.revertedWith('Timelock not passed');
    });

    it('should execute after timelock', async function () {
      await time.increase(VOTING_PERIOD + TIMELOCK_DELAY + 1);

      await expect(
        governance.executeProposal(1)
      ).to.emit(governance, 'ProposalExecuted');
    });
  });

  describe('Proposal Cancellation', function () {
    beforeEach(async function () {
      await governance.connect(user1).createProposal(
        'Test Proposal',
        'Description',
        [owner.address],
        [0],
        ['0x']
      );
    });

    it('should allow proposer to cancel', async function () {
      await expect(
        governance.connect(user1).cancelProposal(1)
      ).to.emit(governance, 'ProposalCancelled');
    });

    it('should not allow non-proposer to cancel', async function () {
      await expect(
        governance.connect(user2).cancelProposal(1)
      ).to.be.revertedWith('Not proposer');
    });
  });
});
