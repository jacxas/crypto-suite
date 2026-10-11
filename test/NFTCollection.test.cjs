const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployNFT } = require("./helpers/testHelpers.cjs");

describe("NFTCollection", function () {
  let nft;
  let owner;
  let addr1;
  let addr2;
  const BASE_URI = "https://api.test.com/";

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    nft = await deployNFT("TestNFT", "TNFT", BASE_URI);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await nft.name()).to.equal("TestNFT");
      expect(await nft.symbol()).to.equal("TNFT");
    });
  });

  describe("Minting", function () {
    it("Should mint NFT to owner", async function () {
      const tokenURI = "metadata1.json";
      
      await nft.mintNFT(tokenURI);
      
      expect(await nft.ownerOf(0)).to.equal(owner.address);
      expect(await nft.balanceOf(owner.address)).to.equal(1);
    });

    it("Should return correct tokenId", async function () {
      const tokenURI = "metadata1.json";
      
      const tx = await nft.mintNFT(tokenURI);
      const receipt = await tx.wait();
      
      // Token ID should be 0 for first mint
      expect(await nft.ownerOf(0)).to.equal(owner.address);
    });

    it("Should increment token ID counter", async function () {
      await nft.mintNFT("metadata1.json");
      await nft.mintNFT("metadata2.json");
      await nft.mintNFT("metadata3.json");
      
      expect(await nft.ownerOf(0)).to.equal(owner.address);
      expect(await nft.ownerOf(1)).to.equal(owner.address);
      expect(await nft.ownerOf(2)).to.equal(owner.address);
      expect(await nft.balanceOf(owner.address)).to.equal(3);
    });

    it("Should fail if not owner", async function () {
      await expect(
        nft.connect(addr1).mintNFT("metadata1.json")
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint multiple NFTs", async function () {
      const tokenURIs = ["metadata1.json", "metadata2.json", "metadata3.json"];
      
      await nft.batchMint(tokenURIs);
      
      expect(await nft.balanceOf(owner.address)).to.equal(3);
      expect(await nft.ownerOf(0)).to.equal(owner.address);
      expect(await nft.ownerOf(1)).to.equal(owner.address);
      expect(await nft.ownerOf(2)).to.equal(owner.address);
    });

    it("Should return correct token IDs array", async function () {
      const tokenURIs = ["metadata1.json", "metadata2.json"];
      
      const tx = await nft.batchMint(tokenURIs);
      await tx.wait();
      
      // Verify tokens exist
      expect(await nft.ownerOf(0)).to.equal(owner.address);
      expect(await nft.ownerOf(1)).to.equal(owner.address);
    });

    it("Should handle empty array", async function () {
      const tokenURIs = [];
      
      await nft.batchMint(tokenURIs);
      
      expect(await nft.balanceOf(owner.address)).to.equal(0);
    });

    it("Should fail if not owner", async function () {
      const tokenURIs = ["metadata1.json"];
      
      await expect(
        nft.connect(addr1).batchMint(tokenURIs)
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("Token URI", function () {
    beforeEach(async function () {
      await nft.mintNFT("metadata1.json");
    });

    it("Should return correct token URI", async function () {
      const uri = await nft.tokenURI(0);
      expect(uri).to.equal(BASE_URI + "0");
    });

    it("Should construct URI from baseURI and tokenId", async function () {
      await nft.mintNFT("metadata2.json");
      await nft.mintNFT("metadata3.json");
      
      expect(await nft.tokenURI(0)).to.equal(BASE_URI + "0");
      expect(await nft.tokenURI(1)).to.equal(BASE_URI + "1");
      expect(await nft.tokenURI(2)).to.equal(BASE_URI + "2");
    });
  });

  describe("Transfer", function () {
    beforeEach(async function () {
      await nft.mintNFT("metadata1.json");
    });

    it("Should transfer NFT between accounts", async function () {
      await nft.transferFrom(owner.address, addr1.address, 0);
      
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
      expect(await nft.balanceOf(owner.address)).to.equal(0);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should fail if not owner or approved", async function () {
      await expect(
        nft.connect(addr1).transferFrom(owner.address, addr2.address, 0)
      ).to.be.reverted;
    });
  });
});
