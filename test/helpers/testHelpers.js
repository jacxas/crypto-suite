const { ethers } = require("hardhat");
const { expect } = require("chai");

/**
 * Helper functions for testing
 */

// Time manipulation helpers
async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine");
}

async function getLatestBlockTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

// Token helpers
async function deployToken(name = "TestToken", symbol = "TT", supply = ethers.parseEther("1000000")) {
  const Token = await ethers.getContractFactory("AdvancedToken");
  const token = await Token.deploy(name, symbol, supply);
  await token.waitForDeployment();
  return token;
}

// NFT helpers
async function deployNFT(name = "TestNFT", symbol = "TNFT", baseURI = "https://api.test.com/") {
  const NFT = await ethers.getContractFactory("NFTCollection");
  const nft = await NFT.deploy(name, symbol, baseURI);
  await nft.waitForDeployment();
  return nft;
}

// Marketplace helpers
async function deployMarketplace(nftAddress, tokenAddress) {
  const Marketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await Marketplace.deploy(nftAddress, tokenAddress);
  await marketplace.waitForDeployment();
  return marketplace;
}

// MultiContract helpers
async function deployMultiContract(tokenAddress) {
  const MultiContract = await ethers.getContractFactory("MultiContract");
  const multiContract = await MultiContract.deploy(tokenAddress);
  await multiContract.waitForDeployment();
  return multiContract;
}

// Expectation helpers
function expectEvent(receipt, eventName, args = {}) {
  const event = receipt.logs.find(log => log.fragment && log.fragment.name === eventName);
  expect(event).to.not.be.undefined;
  
  if (Object.keys(args).length > 0) {
    for (const [key, value] of Object.entries(args)) {
      expect(event.args[key]).to.equal(value);
    }
  }
  
  return event;
}

// Balance helpers
async function getBalance(token, address) {
  return await token.balanceOf(address);
}

module.exports = {
  increaseTime,
  getLatestBlockTimestamp,
  deployToken,
  deployNFT,
  deployMarketplace,
  deployMultiContract,
  expectEvent,
  getBalance
};
