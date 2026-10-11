const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { deployToken, deployNFT, deployMarketplace, deployMultiContract } = require("./helpers/testHelpers.cjs");

describe("Integration Tests", function () {
  let token;
  let nft;
  let marketplace;
  let multiContract;
  let owner;
  let user1;
  let user2;
  let user3;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy all contracts
    token = await deployToken("CryptoToken", "CTK", INITIAL_SUPPLY);
    nft = await deployNFT("CryptoNFT", "CNFT", "https://api.crypto.com/");
    marketplace = await deployMarketplace(await nft.getAddress(), await token.getAddress());
    multiContract = await deployMultiContract(await nft.getAddress(), await token.getAddress());
    
    // Distribute tokens to users
    await token.transfer(user1.address, ethers.parseEther("10000"));
    await token.transfer(user2.address, ethers.parseEther("10000"));
    await token.transfer(user3.address, ethers.parseEther("10000"));
  });

  describe("Complete NFT Marketplace Flow", function () {
    it("Should handle complete buy/sell cycle with fees", async function () {
      // 1. Mint NFT
      await nft.mintNFT("metadata1.json");
      const tokenId = 0;
      
      // 2. Transfer NFT to user1 (seller)
      await nft.transferFrom(owner.address, user1.address, tokenId);
      
      // 3. User1 lists NFT on marketplace
      const price = ethers.parseEther("100");
      await nft.connect(user1).approve(await marketplace.getAddress(), tokenId);
      await marketplace.connect(user1).listNFT(tokenId, price);
      
      // 4. Verify listing
      const listing = await marketplace.listings(tokenId);
      expect(listing.active).to.be.true;
      expect(listing.price).to.equal(price);
      
      // 5. User2 buys NFT (with 1% transfer fee on tokens)
      const user2BalanceBefore = await token.balanceOf(user2.address);
      const user1BalanceBefore = await token.balanceOf(user1.address);
      
      await token.connect(user2).approve(await marketplace.getAddress(), price);
      await marketplace.connect(user2).buyNFT(tokenId);
      
      // 6. Verify NFT ownership changed
      expect(await nft.ownerOf(tokenId)).to.equal(user2.address);
      
      // 7. Verify token transfers (with 1% fee)
      const user2BalanceAfter = await token.balanceOf(user2.address);
      const user1BalanceAfter = await token.balanceOf(user1.address);
      
      // User2 paid price
      expect(user2BalanceBefore - user2BalanceAfter).to.equal(price);
      // User1 received price (marketplace doesn't take fee, but token has 1% transfer fee)
      expect(user1BalanceAfter - user1BalanceBefore).to.equal(price);
    });

    it("Should handle multiple NFT listings and purchases", async function () {
      // Mint multiple NFTs
      await nft.batchMint(["metadata1.json", "metadata2.json", "metadata3.json"]);
      
      // Transfer to user1
      await nft.transferFrom(owner.address, user1.address, 0);
      await nft.transferFrom(owner.address, user1.address, 1);
      await nft.transferFrom(owner.address, user1.address, 2);
      
      // List all NFTs
      await nft.connect(user1).setApprovalForAll(await marketplace.getAddress(), true);
      await marketplace.connect(user1).listNFT(0, ethers.parseEther("100"));
      await marketplace.connect(user1).listNFT(1, ethers.parseEther("200"));
      await marketplace.connect(user1).listNFT(2, ethers.parseEther("300"));
      
      // Verify all active
      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(3);
      
      // User2 buys first NFT
      await token.connect(user2).approve(await marketplace.getAddress(), ethers.parseEther("100"));
      await marketplace.connect(user2).buyNFT(0);
      
      // User3 buys second NFT
      await token.connect(user3).approve(await marketplace.getAddress(), ethers.parseEther("200"));
      await marketplace.connect(user3).buyNFT(1);
      
      // Verify ownership
      expect(await nft.ownerOf(0)).to.equal(user2.address);
      expect(await nft.ownerOf(1)).to.equal(user3.address);
      expect(await nft.ownerOf(2)).to.equal(await marketplace.getAddress());
      
      // Verify only one listing remains
      const remainingListings = await marketplace.getActiveListings();
      expect(remainingListings.length).to.equal(1);
      expect(remainingListings[0].tokenId).to.equal(2);
    });
  });

  describe("Token Staking and Marketplace Integration", function () {
    it("Should allow staking rewards to be used for NFT purchases", async function () {
      // 1. User1 stakes tokens
      const stakeAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(await token.getAddress(), stakeAmount);
      await token.connect(user1).stake(stakeAmount);
      
      // 2. Wait for rewards to accumulate (1 day = 10% APR / 365)
      await time.increase(86400); // 1 day
      
      // 3. User1 unstakes with rewards
      await token.connect(user1).unstake(stakeAmount);
      const balanceAfterUnstake = await token.balanceOf(user1.address);
      
      // Should have original balance + rewards
      expect(balanceAfterUnstake).to.be.gt(ethers.parseEther("10000"));
      
      // 4. Mint and list NFT
      await nft.mintNFT("metadata1.json");
      await nft.approve(await marketplace.getAddress(), 0);
      await marketplace.listNFT(0, ethers.parseEther("100"));
      
      // 5. User1 buys NFT with staking rewards
      await token.connect(user1).approve(await marketplace.getAddress(), ethers.parseEther("100"));
      await marketplace.connect(user1).buyNFT(0);
      
      expect(await nft.ownerOf(0)).to.equal(user1.address);
    });

    it("Should handle auto-compound while trading NFTs", async function () {
      // 1. User1 stakes and enables auto-compound
      const stakeAmount = ethers.parseEther("5000");
      await token.connect(user1).approve(await token.getAddress(), stakeAmount);
      await token.connect(user1).stake(stakeAmount);
      await token.connect(user1).setAutoCompound(true);
      
      // 2. Wait for rewards
      await time.increase(86400 * 7); // 7 days
      
      // 3. Trigger compound
      await token.connect(user1).compound();
      
      const stakeInfo = await token.stakes(user1.address);
      expect(stakeInfo.amount).to.be.gt(stakeAmount);
      
      // 4. Meanwhile, user1 can still trade NFTs with unstaked tokens
      await nft.mintNFT("metadata1.json");
      await nft.transferFrom(owner.address, user2.address, 0);
      await nft.connect(user2).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(user2).listNFT(0, ethers.parseEther("100"));
      
      await token.connect(user1).approve(await marketplace.getAddress(), ethers.parseEther("100"));
      await marketplace.connect(user1).buyNFT(0);
      
      expect(await nft.ownerOf(0)).to.equal(user1.address);
    });
  });

  describe("MultiSig Escrow and Marketplace Integration", function () {
    it("Should handle NFT escrow before marketplace listing", async function () {
      // 1. Mint NFT
      await nft.mintNFT("metadata1.json");
      const tokenId = 0;
      
      // 2. Deposit NFT to escrow for user1
      await nft.approve(await multiContract.getAddress(), tokenId);
      await multiContract.depositNFT(tokenId, user1.address);
      
      // 3. Verify NFT is in escrow
      expect(await nft.ownerOf(tokenId)).to.equal(await multiContract.getAddress());
      
      // 4. Release NFT to user1
      await multiContract.releaseNFT(tokenId);
      expect(await nft.ownerOf(tokenId)).to.equal(user1.address);
      
      // 5. User1 lists NFT on marketplace
      await nft.connect(user1).approve(await marketplace.getAddress(), tokenId);
      await marketplace.connect(user1).listNFT(tokenId, ethers.parseEther("100"));
      
      // 6. User2 buys NFT
      await token.connect(user2).approve(await marketplace.getAddress(), ethers.parseEther("100"));
      await marketplace.connect(user2).buyNFT(tokenId);
      
      expect(await nft.ownerOf(tokenId)).to.equal(user2.address);
    });

    it("Should handle multi-sig token distribution for NFT purchases", async function () {
      // 1. Setup multi-sig with 2 signers, 2 required
      await multiContract.addSigner(user1.address);
      await multiContract.changeRequiredSignatures(2);
      
      // 2. Transfer tokens to multi-sig wallet
      await token.transfer(await multiContract.getAddress(), ethers.parseEther("1000"));
      
      // 3. Mint and list NFT
      await nft.mintNFT("metadata1.json");
      await nft.approve(await marketplace.getAddress(), 0);
      await marketplace.listNFT(0, ethers.parseEther("100"));
      
      // 4. Submit transaction to buy NFT (send tokens to user2 who will buy)
      await multiContract.submitTransaction(user2.address, ethers.parseEther("100"));
      
      // 5. Second signer approves
      await multiContract.connect(user1).signTransaction(0);
      
      // 6. Execute transaction
      await multiContract.executeTransaction(0);
      
      // 7. User2 now has tokens and buys NFT
      await token.connect(user2).approve(await marketplace.getAddress(), ethers.parseEther("100"));
      await marketplace.connect(user2).buyNFT(0);
      
      expect(await nft.ownerOf(0)).to.equal(user2.address);
    });
  });

  describe("Complex Multi-Contract Scenarios", function () {
    it("Should handle staking, escrow, and marketplace in sequence", async function () {
      // 1. User1 stakes tokens to earn rewards
      const stakeAmount = ethers.parseEther("5000");
      await token.connect(user1).approve(await token.getAddress(), stakeAmount);
      await token.connect(user1).stake(stakeAmount);
      
      // 2. Owner mints NFT and puts in escrow for user2
      await nft.mintNFT("metadata1.json");
      await nft.approve(await multiContract.getAddress(), 0);
      await multiContract.depositNFT(0, user2.address);
      
      // 3. Wait for staking rewards
      await time.increase(86400 * 3); // 3 days
      
      // 4. Release NFT to user2
      await multiContract.releaseNFT(0);
      expect(await nft.ownerOf(0)).to.equal(user2.address);
      
      // 5. User2 lists NFT on marketplace
      await nft.connect(user2).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(user2).listNFT(0, ethers.parseEther("200"));
      
      // 6. User1 unstakes and uses rewards to buy NFT
      await token.connect(user1).unstake(stakeAmount);
      await token.connect(user1).approve(await marketplace.getAddress(), ethers.parseEther("200"));
      await marketplace.connect(user1).buyNFT(0);
      
      // 7. Verify final state
      expect(await nft.ownerOf(0)).to.equal(user1.address);
      expect(await token.balanceOf(user2.address)).to.be.gt(ethers.parseEther("10000"));
    });

    it("Should handle batch NFT operations across all contracts", async function () {
      // 1. Batch mint NFTs
      await nft.batchMint(["metadata1.json", "metadata2.json", "metadata3.json", "metadata4.json", "metadata5.json"]);
      
      // 2. Put some in escrow
      await nft.approve(await multiContract.getAddress(), 0);
      await nft.approve(await multiContract.getAddress(), 1);
      await multiContract.depositNFT(0, user1.address);
      await multiContract.depositNFT(1, user2.address);
      
      // 3. List others on marketplace
      await nft.approve(await marketplace.getAddress(), 2);
      await nft.approve(await marketplace.getAddress(), 3);
      await marketplace.listNFT(2, ethers.parseEther("100"));
      await marketplace.listNFT(3, ethers.parseEther("150"));
      
      // 4. Keep one for owner
      expect(await nft.ownerOf(4)).to.equal(owner.address);
      
      // 5. Release escrowed NFTs
      await multiContract.releaseNFT(0);
      await multiContract.releaseNFT(1);
      
      // 6. Verify distribution
      expect(await nft.ownerOf(0)).to.equal(user1.address);
      expect(await nft.ownerOf(1)).to.equal(user2.address);
      expect(await nft.ownerOf(2)).to.equal(await marketplace.getAddress());
      expect(await nft.ownerOf(3)).to.equal(await marketplace.getAddress());
      expect(await nft.ownerOf(4)).to.equal(owner.address);
      
      // 7. Buy marketplace NFTs
      await token.connect(user3).approve(await marketplace.getAddress(), ethers.parseEther("100"));
      await marketplace.connect(user3).buyNFT(2);
      
      expect(await nft.ownerOf(2)).to.equal(user3.address);
    });

    it("Should handle token fees across all operations", async function () {
      const initialBalance = await token.balanceOf(user1.address);
      
      // 1. Transfer with fee
      await token.connect(user1).transfer(user2.address, ethers.parseEther("100"));
      const afterTransfer = await token.balanceOf(user1.address);
      expect(initialBalance - afterTransfer).to.equal(ethers.parseEther("100"));
      
      // 2. Stake (no fee on stake)
      await token.connect(user1).approve(await token.getAddress(), ethers.parseEther("1000"));
      await token.connect(user1).stake(ethers.parseEther("1000"));
      
      // 3. Marketplace purchase (fee on token transfer)
      await nft.mintNFT("metadata1.json");
      await nft.approve(await marketplace.getAddress(), 0);
      await marketplace.listNFT(0, ethers.parseEther("100"));
      
      await token.connect(user2).approve(await marketplace.getAddress(), ethers.parseEther("100"));
      await marketplace.connect(user2).buyNFT(0);
      
      // Verify NFT ownership
      expect(await nft.ownerOf(0)).to.equal(user2.address);
    });
  });

  describe("Error Handling and Edge Cases", function () {
    it("Should prevent double-spending NFTs", async function () {
      await nft.mintNFT("metadata1.json");
      
      // Try to list on marketplace
      await nft.approve(await marketplace.getAddress(), 0);
      await marketplace.listNFT(0, ethers.parseEther("100"));
      
      // Try to also put in escrow (should fail - already transferred)
      await expect(
        multiContract.depositNFT(0, user1.address)
      ).to.be.reverted;
    });

    it("Should handle insufficient token balance for purchases", async function () {
      await nft.mintNFT("metadata1.json");
      await nft.approve(await marketplace.getAddress(), 0);
      await marketplace.listNFT(0, ethers.parseEther("100000")); // Very high price
      
      await token.connect(user1).approve(await marketplace.getAddress(), ethers.parseEther("100000"));
      
      await expect(
        marketplace.connect(user1).buyNFT(0)
      ).to.be.reverted; // Insufficient balance
    });

    it("Should handle cancelled marketplace listings", async function () {
      await nft.mintNFT("metadata1.json");
      await nft.approve(await marketplace.getAddress(), 0);
      await marketplace.listNFT(0, ethers.parseEther("100"));
      
      // Cancel listing
      await marketplace.cancelListing(0);
      
      // Try to buy (should fail)
      await token.connect(user1).approve(await marketplace.getAddress(), ethers.parseEther("100"));
      await expect(
        marketplace.connect(user1).buyNFT(0)
      ).to.be.revertedWith("Not listed");
    });

    it("Should handle multi-sig with insufficient signatures", async function () {
      await multiContract.addSigner(user1.address);
      await multiContract.changeRequiredSignatures(2);
      await token.transfer(await multiContract.getAddress(), ethers.parseEther("1000"));
      
      // Submit transaction
      await multiContract.submitTransaction(user2.address, ethers.parseEther("100"));
      
      // Try to execute without enough signatures
      await expect(
        multiContract.executeTransaction(0)
      ).to.be.revertedWith("Not enough signatures");
    });
  });
});
