const { expect } = require("chai");
const { ethers } = require("hardhat");
const { increaseTime, deployToken } = require("./helpers/testHelpers");

describe("AdvancedToken", function () {
  let token;
  let owner;
  let addr1;
  let addr2;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const FEE_PERCENT = 1n;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    token = await deployToken("AdvancedToken", "ADV", INITIAL_SUPPLY);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("AdvancedToken");
      expect(await token.symbol()).to.equal("ADV");
    });
  });

  describe("Transfers with Fee", function () {
    it("Should transfer tokens with 1% fee", async function () {
      const amount = ethers.parseEther("100");
      const fee = (amount * FEE_PERCENT) / 100n;
      const netAmount = amount - fee;

      await token.transfer(addr1.address, amount);

      expect(await token.balanceOf(addr1.address)).to.equal(netAmount);
      expect(await token.rewardPool()).to.equal(fee);
    });

    it("Should accumulate fees in reward pool", async function () {
      const amount = ethers.parseEther("100");
      
      await token.transfer(addr1.address, amount);
      await token.transfer(addr2.address, amount);

      const expectedFees = (amount * FEE_PERCENT * 2n) / 100n;
      expect(await token.rewardPool()).to.equal(expectedFees);
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      await token.transfer(addr1.address, amount);
    });

    it("Should allow users to stake tokens", async function () {
      const stakeAmount = ethers.parseEther("100");
      
      await token.connect(addr1).stake(stakeAmount);

      expect(await token.stakingBalance(addr1.address)).to.equal(stakeAmount);
      expect(await token.totalStaked()).to.equal(stakeAmount);
    });

    it("Should emit Staked event", async function () {
      const stakeAmount = ethers.parseEther("100");
      
      await expect(token.connect(addr1).stake(stakeAmount))
        .to.emit(token, "Staked")
        .withArgs(addr1.address, stakeAmount);
    });

    it("Should fail if insufficient balance", async function () {
      const stakeAmount = ethers.parseEther("10000");
      
      await expect(
        token.connect(addr1).stake(stakeAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should allow multiple stakes from same user", async function () {
      const stakeAmount1 = ethers.parseEther("50");
      const stakeAmount2 = ethers.parseEther("30");
      
      await token.connect(addr1).stake(stakeAmount1);
      await token.connect(addr1).stake(stakeAmount2);

      expect(await token.stakingBalance(addr1.address)).to.equal(stakeAmount1 + stakeAmount2);
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      await token.transfer(addr1.address, amount);
      await token.connect(addr1).stake(ethers.parseEther("500"));
    });

    it("Should allow users to unstake tokens", async function () {
      const unstakeAmount = ethers.parseEther("200");
      const initialBalance = await token.balanceOf(addr1.address);
      
      await token.connect(addr1).unstake(unstakeAmount);

      expect(await token.stakingBalance(addr1.address)).to.equal(ethers.parseEther("300"));
      expect(await token.balanceOf(addr1.address)).to.equal(initialBalance + unstakeAmount);
    });

    it("Should emit Unstaked event", async function () {
      const unstakeAmount = ethers.parseEther("100");
      
      await expect(token.connect(addr1).unstake(unstakeAmount))
        .to.emit(token, "Unstaked")
        .withArgs(addr1.address, unstakeAmount);
    });

    it("Should fail if insufficient staked balance", async function () {
      const unstakeAmount = ethers.parseEther("1000");
      
      await expect(
        token.connect(addr1).unstake(unstakeAmount)
      ).to.be.revertedWith("Insufficient staked balance");
    });
  });

  describe("Rewards Calculation", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      await token.transfer(addr1.address, amount);
      await token.connect(addr1).stake(ethers.parseEther("100"));
    });

    it("Should calculate rewards based on time staked", async function () {
      await increaseTime(86400); // 1 day
      
      const rewards = await token.calculateRewards(addr1.address);
      expect(rewards).to.be.gt(0);
    });

    it("Should return 0 rewards if not staking", async function () {
      const rewards = await token.calculateRewards(addr2.address);
      expect(rewards).to.equal(0);
    });

    it("Should increase rewards over time", async function () {
      await increaseTime(86400); // 1 day
      const rewards1 = await token.calculateRewards(addr1.address);
      
      await increaseTime(86400); // 1 more day
      const rewards2 = await token.calculateRewards(addr1.address);
      
      expect(rewards2).to.be.gt(rewards1);
    });
  });

  describe("Auto Compound", function () {
    beforeEach(async function () {
      // Create reward pool
      const amount = ethers.parseEther("1000");
      await token.transfer(addr1.address, amount);
      await token.transfer(addr2.address, amount);
    });

    it("Should allow owner to auto compound", async function () {
      const rewardPoolBefore = await token.rewardPool();
      const totalStakedBefore = await token.totalStaked();
      
      await token.autoCompound();
      
      const rewardPoolAfter = await token.rewardPool();
      const totalStakedAfter = await token.totalStaked();
      
      expect(rewardPoolAfter).to.be.lt(rewardPoolBefore);
      expect(totalStakedAfter).to.be.gt(totalStakedBefore);
    });

    it("Should emit AutoCompounded event", async function () {
      await expect(token.autoCompound())
        .to.emit(token, "AutoCompounded");
    });

    it("Should fail if not owner", async function () {
      await expect(
        token.connect(addr1).autoCompound()
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });
});
