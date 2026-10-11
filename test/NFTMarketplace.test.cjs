const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployToken, deployNFT, deployMarketplace } = require("./helpers/testHelpers.cjs");

describe("NFTMarketplace", function () {
  let marketplace;
  let nft;
  let token;
  let owner;
  let seller;
  let buyer;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();
    
    // Deploy token and NFT
    token = await deployToken("TestToken", "TT", INITIAL_SUPPLY);
    nft = await deployNFT("TestNFT", "TNFT", "https://api.test.com/");
    
    // Deploy marketplace
    marketplace = await deployMarketplace(await nft.getAddress(), await token.getAddress());
    
    // Mint NFT to seller
    await nft.mintNFT("metadata1.json");
    await nft.transferFrom(owner.address, seller.address, 0);
    
    // Give buyer some tokens
    await token.transfer(buyer.address, ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("Should set the correct NFT contract", async function () {
      expect(await marketplace.nft()).to.equal(await nft.getAddress());
    });

    it("Should set the correct token contract", async function () {
      expect(await marketplace.token()).to.equal(await token.getAddress());
    });
  });

  describe("Listing NFTs", function () {
    it("Should list NFT for sale", async function () {
      const price = ethers.parseEther("100");
      
      // Approve marketplace
      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      
      await marketplace.connect(seller).listNFT(0, price);
      
      const listing = await marketplace.listings(0);
      expect(listing.tokenId).to.equal(0);
      expect(listing.price).to.equal(price);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.active).to.be.true;
    });

    it("Should emit Listed event", async function () {
      const price = ethers.parseEther("100");
      
      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      
      await expect(marketplace.connect(seller).listNFT(0, price))
        .to.emit(marketplace, "Listed")
        .withArgs(0, price, seller.address);
    });

    it("Should fail if not NFT owner", async function () {
      const price = ethers.parseEther("100");
      
      await expect(
        marketplace.connect(buyer).listNFT(0, price)
      ).to.be.revertedWith("Not owner");
    });

    it("Should fail if marketplace not approved", async function () {
      const price = ethers.parseEther("100");
      
      await expect(
        marketplace.connect(seller).listNFT(0, price)
      ).to.be.revertedWith("Not approved");
    });

    it("Should add to active listings", async function () {
      const price = ethers.parseEther("100");
      
      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(seller).listNFT(0, price);
      
      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(1);
      expect(activeListings[0].tokenId).to.equal(0);
    });
  });

  describe("Buying NFTs", function () {
    beforeEach(async function () {
      const price = ethers.parseEther("100");
      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(seller).listNFT(0, price);
    });

    it("Should allow buying listed NFT", async function () {
      const price = ethers.parseEther("100");
      
      // Approve marketplace to spend buyer's tokens
      await token.connect(buyer).approve(await marketplace.getAddress(), price);
      
      await marketplace.connect(buyer).buyNFT(0);
      
      expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("Should transfer payment to seller", async function () {
      const price = ethers.parseEther("100");
      const sellerBalanceBefore = await token.balanceOf(seller.address);
      
      await token.connect(buyer).approve(await marketplace.getAddress(), price);
      await marketplace.connect(buyer).buyNFT(0);
      
      const sellerBalanceAfter = await token.balanceOf(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(price);
    });

    it("Should emit Bought event", async function () {
      const price = ethers.parseEther("100");
      
      await token.connect(buyer).approve(await marketplace.getAddress(), price);
      
      await expect(marketplace.connect(buyer).buyNFT(0))
        .to.emit(marketplace, "Bought")
        .withArgs(0, price, buyer.address, seller.address);
    });

    it("Should remove from active listings", async function () {
      const price = ethers.parseEther("100");
      
      await token.connect(buyer).approve(await marketplace.getAddress(), price);
      await marketplace.connect(buyer).buyNFT(0);
      
      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(0);
    });

    it("Should fail if not listed", async function () {
      await expect(
        marketplace.connect(buyer).buyNFT(999)
      ).to.be.revertedWith("Not listed");
    });

    it("Should fail if insufficient token approval", async function () {
      await expect(
        marketplace.connect(buyer).buyNFT(0)
      ).to.be.reverted;
    });
  });

  describe("Cancelling Listings", function () {
    beforeEach(async function () {
      const price = ethers.parseEther("100");
      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(seller).listNFT(0, price);
    });

    it("Should allow seller to cancel listing", async function () {
      await marketplace.connect(seller).cancelListing(0);
      
      const listing = await marketplace.listings(0);
      expect(listing.active).to.be.false;
    });

    it("Should emit Cancelled event", async function () {
      await expect(marketplace.connect(seller).cancelListing(0))
        .to.emit(marketplace, "Cancelled")
        .withArgs(0, seller.address);
    });

    it("Should remove from active listings", async function () {
      await marketplace.connect(seller).cancelListing(0);
      
      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(0);
    });

    it("Should fail if not seller", async function () {
      await expect(
        marketplace.connect(buyer).cancelListing(0)
      ).to.be.revertedWith("Not seller");
    });
  });

  describe("Get Active Listings", function () {
    it("Should return empty array when no listings", async function () {
      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(0);
    });

    it("Should return all active listings", async function () {
      // Mint more NFTs
      await nft.mintNFT("metadata2.json");
      await nft.mintNFT("metadata3.json");
      await nft.transferFrom(owner.address, seller.address, 1);
      await nft.transferFrom(owner.address, seller.address, 2);
      
      // List multiple NFTs
      await nft.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
      await marketplace.connect(seller).listNFT(0, ethers.parseEther("100"));
      await marketplace.connect(seller).listNFT(1, ethers.parseEther("200"));
      await marketplace.connect(seller).listNFT(2, ethers.parseEther("300"));
      
      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(3);
    });

    it("Should not include cancelled listings", async function () {
      const price = ethers.parseEther("100");
      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(seller).listNFT(0, price);
      await marketplace.connect(seller).cancelListing(0);
      
      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(0);
    });
  });
});
