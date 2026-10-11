// Tests for LiquidityPool.sol
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('LiquidityPool', function () {
  let liquidityPool;
  let tokenA, tokenB;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory('MockERC20');
    tokenA = await MockToken.deploy('Token A', 'TKA', ethers.parseEther('1000000'));
    tokenB = await MockToken.deploy('Token B', 'TKB', ethers.parseEther('1000000'));

    // Deploy LiquidityPool
    const LiquidityPool = await ethers.getContractFactory('LiquidityPool');
    liquidityPool = await LiquidityPool.deploy();

    // Distribute tokens
    await tokenA.transfer(user1.address, ethers.parseEther('10000'));
    await tokenB.transfer(user1.address, ethers.parseEther('10000'));
  });

  describe('Pool Creation', function () {
    it('should create a new pool', async function () {
      await liquidityPool.createPool(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther('100') // rewards per block
      );

      const pool = await liquidityPool.pools(0);
      expect(pool.tokenA).to.equal(await tokenA.getAddress());
      expect(pool.tokenB).to.equal(await tokenB.getAddress());
    });

    it('should emit PoolCreated event', async function () {
      await expect(
        liquidityPool.createPool(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          ethers.parseEther('100')
        )
      ).to.emit(liquidityPool, 'PoolCreated');
    });

    it('should revert with same token addresses', async function () {
      await expect(
        liquidityPool.createPool(
          await tokenA.getAddress(),
          await tokenA.getAddress(),
          ethers.parseEther('100')
        )
      ).to.be.revertedWith('Identical tokens');
    });
  });

  describe('Liquidity', function () {
    beforeEach(async function () {
      await liquidityPool.createPool(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther('100')
      );

      // Approve tokens
      await tokenA.connect(user1).approve(await liquidityPool.getAddress(), ethers.MaxUint256);
      await tokenB.connect(user1).approve(await liquidityPool.getAddress(), ethers.MaxUint256);
    });

    it('should add liquidity', async function () {
      await liquidityPool.connect(user1).addLiquidity(
        0,
        ethers.parseEther('100'),
        ethers.parseEther('100')
      );

      const position = await liquidityPool.userPositions(0, user1.address);
      expect(position.lpTokens).to.be.gt(0);
    });

    it('should remove liquidity', async function () {
      await liquidityPool.connect(user1).addLiquidity(
        0,
        ethers.parseEther('100'),
        ethers.parseEther('100')
      );

      const position = await liquidityPool.userPositions(0, user1.address);
      
      await liquidityPool.connect(user1).removeLiquidity(0, position.lpTokens);

      const newPosition = await liquidityPool.userPositions(0, user1.address);
      expect(newPosition.lpTokens).to.equal(0);
    });
  });

  describe('Swaps', function () {
    beforeEach(async function () {
      await liquidityPool.createPool(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther('100')
      );

      await tokenA.connect(user1).approve(await liquidityPool.getAddress(), ethers.MaxUint256);
      await tokenB.connect(user1).approve(await liquidityPool.getAddress(), ethers.MaxUint256);

      // Add initial liquidity
      await liquidityPool.connect(user1).addLiquidity(
        0,
        ethers.parseEther('1000'),
        ethers.parseEther('1000')
      );
    });

    it('should swap tokenA for tokenB', async function () {
      const balanceBefore = await tokenB.balanceOf(user1.address);

      await liquidityPool.connect(user1).swap(
        0,
        await tokenA.getAddress(),
        ethers.parseEther('10'),
        0
      );

      const balanceAfter = await tokenB.balanceOf(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it('should apply swap fee', async function () {
      // With 0.3% fee, output should be less than input
      const inputAmount = ethers.parseEther('100');
      
      await liquidityPool.connect(user1).swap(
        0,
        await tokenA.getAddress(),
        inputAmount,
        0
      );

      const pool = await liquidityPool.pools(0);
      expect(pool.totalFees).to.be.gt(0);
    });
  });

  describe('Rewards', function () {
    beforeEach(async function () {
      await liquidityPool.createPool(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther('100')
      );

      await tokenA.connect(user1).approve(await liquidityPool.getAddress(), ethers.MaxUint256);
      await tokenB.connect(user1).approve(await liquidityPool.getAddress(), ethers.MaxUint256);

      await liquidityPool.connect(user1).addLiquidity(
        0,
        ethers.parseEther('100'),
        ethers.parseEther('100')
      );
    });

    it('should accumulate rewards over time', async function () {
      // Mine some blocks
      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);

      const pendingRewards = await liquidityPool.pendingRewards(0, user1.address);
      expect(pendingRewards).to.be.gt(0);
    });

    it('should claim rewards', async function () {
      await ethers.provider.send('evm_mine', []);

      await expect(
        liquidityPool.connect(user1).claimRewards(0)
      ).to.emit(liquidityPool, 'RewardsClaimed');
    });
  });
});
