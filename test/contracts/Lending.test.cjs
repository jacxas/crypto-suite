// Tests for Lending.sol
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Lending', function () {
  let lending;
  let collateralToken, borrowToken;
  let priceOracle;
  let owner, user1, user2, liquidator;

  const COLLATERAL_FACTOR = 75; // 75%
  const LIQUIDATION_THRESHOLD = 80; // 80%
  const BASE_RATE = 2; // 2%

  beforeEach(async function () {
    [owner, user1, user2, liquidator] = await ethers.getSigners();

    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory('MockERC20');
    collateralToken = await MockToken.deploy('Collateral', 'COL', ethers.parseEther('1000000'));
    borrowToken = await MockToken.deploy('Borrow', 'BOR', ethers.parseEther('1000000'));

    // Deploy mock price oracle
    const MockOracle = await ethers.getContractFactory('MockPriceOracle');
    priceOracle = await MockOracle.deploy();
    await priceOracle.setPrice(await collateralToken.getAddress(), ethers.parseEther('100')); // $100
    await priceOracle.setPrice(await borrowToken.getAddress(), ethers.parseEther('1')); // $1

    // Deploy Lending
    const Lending = await ethers.getContractFactory('Lending');
    lending = await Lending.deploy(await priceOracle.getAddress());

    // Create markets
    await lending.createMarket(
      await collateralToken.getAddress(),
      COLLATERAL_FACTOR,
      LIQUIDATION_THRESHOLD,
      BASE_RATE
    );
    await lending.createMarket(
      await borrowToken.getAddress(),
      COLLATERAL_FACTOR,
      LIQUIDATION_THRESHOLD,
      BASE_RATE
    );

    // Distribute tokens
    await collateralToken.transfer(user1.address, ethers.parseEther('1000'));
    await borrowToken.transfer(user2.address, ethers.parseEther('100000'));
    await borrowToken.transfer(liquidator.address, ethers.parseEther('100000'));

    // Approve
    await collateralToken.connect(user1).approve(await lending.getAddress(), ethers.MaxUint256);
    await borrowToken.connect(user2).approve(await lending.getAddress(), ethers.MaxUint256);
    await borrowToken.connect(liquidator).approve(await lending.getAddress(), ethers.MaxUint256);
  });

  describe('Supply', function () {
    it('should supply collateral', async function () {
      await lending.connect(user1).supply(
        await collateralToken.getAddress(),
        ethers.parseEther('100')
      );

      const position = await lending.userPositions(user1.address, await collateralToken.getAddress());
      expect(position.supplied).to.equal(ethers.parseEther('100'));
    });

    it('should emit Supply event', async function () {
      await expect(
        lending.connect(user1).supply(
          await collateralToken.getAddress(),
          ethers.parseEther('100')
        )
      ).to.emit(lending, 'Supply');
    });

    it('should update market total supply', async function () {
      await lending.connect(user1).supply(
        await collateralToken.getAddress(),
        ethers.parseEther('100')
      );

      const market = await lending.markets(await collateralToken.getAddress());
      expect(market.totalSupply).to.equal(ethers.parseEther('100'));
    });
  });

  describe('Withdraw', function () {
    beforeEach(async function () {
      await lending.connect(user1).supply(
        await collateralToken.getAddress(),
        ethers.parseEther('100')
      );
    });

    it('should withdraw collateral', async function () {
      await lending.connect(user1).withdraw(
        await collateralToken.getAddress(),
        ethers.parseEther('50')
      );

      const position = await lending.userPositions(user1.address, await collateralToken.getAddress());
      expect(position.supplied).to.equal(ethers.parseEther('50'));
    });

    it('should not withdraw more than supplied', async function () {
      await expect(
        lending.connect(user1).withdraw(
          await collateralToken.getAddress(),
          ethers.parseEther('200')
        )
      ).to.be.revertedWith('Insufficient balance');
    });
  });

  describe('Borrow', function () {
    beforeEach(async function () {
      // User1 supplies collateral
      await lending.connect(user1).supply(
        await collateralToken.getAddress(),
        ethers.parseEther('100')
      );

      // User2 supplies borrow token (liquidity)
      await lending.connect(user2).supply(
        await borrowToken.getAddress(),
        ethers.parseEther('50000')
      );
    });

    it('should borrow against collateral', async function () {
      // 100 COL * $100 * 75% = $7500 max borrow
      await lending.connect(user1).borrow(
        await borrowToken.getAddress(),
        ethers.parseEther('5000') // $5000
      );

      const position = await lending.userPositions(user1.address, await borrowToken.getAddress());
      expect(position.borrowed).to.equal(ethers.parseEther('5000'));
    });

    it('should not borrow more than collateral allows', async function () {
      await expect(
        lending.connect(user1).borrow(
          await borrowToken.getAddress(),
          ethers.parseEther('10000') // $10000 > $7500 max
        )
      ).to.be.revertedWith('Insufficient collateral');
    });

    it('should update health factor', async function () {
      await lending.connect(user1).borrow(
        await borrowToken.getAddress(),
        ethers.parseEther('5000')
      );

      const healthFactor = await lending.getHealthFactor(user1.address);
      expect(healthFactor).to.be.gt(ethers.parseEther('1')); // > 1 means healthy
    });
  });

  describe('Repay', function () {
    beforeEach(async function () {
      await lending.connect(user1).supply(
        await collateralToken.getAddress(),
        ethers.parseEther('100')
      );
      await lending.connect(user2).supply(
        await borrowToken.getAddress(),
        ethers.parseEther('50000')
      );
      await lending.connect(user1).borrow(
        await borrowToken.getAddress(),
        ethers.parseEther('5000')
      );

      // Give user1 tokens to repay
      await borrowToken.transfer(user1.address, ethers.parseEther('10000'));
      await borrowToken.connect(user1).approve(await lending.getAddress(), ethers.MaxUint256);
    });

    it('should repay borrowed amount', async function () {
      await lending.connect(user1).repay(
        await borrowToken.getAddress(),
        ethers.parseEther('2500')
      );

      const position = await lending.userPositions(user1.address, await borrowToken.getAddress());
      expect(position.borrowed).to.equal(ethers.parseEther('2500'));
    });

    it('should repay full amount', async function () {
      await lending.connect(user1).repay(
        await borrowToken.getAddress(),
        ethers.MaxUint256 // Repay all
      );

      const position = await lending.userPositions(user1.address, await borrowToken.getAddress());
      expect(position.borrowed).to.equal(0);
    });
  });

  describe('Liquidation', function () {
    beforeEach(async function () {
      await lending.connect(user1).supply(
        await collateralToken.getAddress(),
        ethers.parseEther('100')
      );
      await lending.connect(user2).supply(
        await borrowToken.getAddress(),
        ethers.parseEther('50000')
      );
      await lending.connect(user1).borrow(
        await borrowToken.getAddress(),
        ethers.parseEther('7000') // Close to max
      );
    });

    it('should not liquidate healthy position', async function () {
      await expect(
        lending.connect(liquidator).liquidate(
          user1.address,
          await collateralToken.getAddress(),
          await borrowToken.getAddress(),
          ethers.parseEther('1000')
        )
      ).to.be.revertedWith('Position is healthy');
    });

    it('should liquidate unhealthy position', async function () {
      // Drop collateral price to make position unhealthy
      await priceOracle.setPrice(await collateralToken.getAddress(), ethers.parseEther('50')); // $50

      await expect(
        lending.connect(liquidator).liquidate(
          user1.address,
          await collateralToken.getAddress(),
          await borrowToken.getAddress(),
          ethers.parseEther('1000')
        )
      ).to.emit(lending, 'Liquidation');
    });
  });

  describe('Interest Rates', function () {
    it('should calculate dynamic interest rate', async function () {
      const rate = await lending.getInterestRate(await borrowToken.getAddress());
      expect(rate).to.be.gte(BASE_RATE);
    });

    it('should increase rate with utilization', async function () {
      await lending.connect(user1).supply(
        await collateralToken.getAddress(),
        ethers.parseEther('100')
      );
      await lending.connect(user2).supply(
        await borrowToken.getAddress(),
        ethers.parseEther('10000')
      );

      const rateBefore = await lending.getInterestRate(await borrowToken.getAddress());

      await lending.connect(user1).borrow(
        await borrowToken.getAddress(),
        ethers.parseEther('7000')
      );

      const rateAfter = await lending.getInterestRate(await borrowToken.getAddress());
      expect(rateAfter).to.be.gt(rateBefore);
    });
  });
});
