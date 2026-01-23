const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crypto Suite Tests", function () {
  let token, nftCollection, marketplace;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy AdvancedToken
    const AdvancedToken = await ethers.getContractFactory("AdvancedToken");
    token = await AdvancedToken.deploy(
      "Test Token",
      "TEST",
      ethers.utils.parseEther("1000000")
    );
    await token.deployed();

    // Deploy NFTCollection
    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    nftCollection = await NFTCollection.deploy(
      "Test NFT",
      "TNFT",
      "https://test.com/",
      ethers.utils.parseEther("0.01"),
      100
    );
    await nftCollection.deployed();

    // Deploy NFTMarketplace
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    marketplace = await NFTMarketplace.deploy();
    await marketplace.deployed();
  });

  describe("AdvancedToken", function () {
    it("Should deploy with correct initial supply", async function () {
      const totalSupply = await token.totalSupply();
      expect(totalSupply).to.equal(ethers.utils.parseEther("1000000"));
    });

    it("Should assign total supply to owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(await token.totalSupply());
    });

    it("Should transfer tokens between accounts", async function () {
      await token.transfer(addr1.address, ethers.utils.parseEther("100"));
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should burn tokens", async function () {
      const initialSupply = await token.totalSupply();
      await token.burn(ethers.utils.parseEther("100"));
      const newSupply = await token.totalSupply();
      expect(newSupply).to.equal(initialSupply.sub(ethers.utils.parseEther("100")));
    });

    it("Should pause and unpause transfers", async function () {
      await token.pause();
      await expect(
        token.transfer(addr1.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Pausable: paused");

      await token.unpause();
      await token.transfer(addr1.address, ethers.utils.parseEther("100"));
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseEther("100"));
    });
  });

  describe("NFTCollection", function () {
    it("Should mint NFT with correct price", async function () {
      await nftCollection.connect(addr1).mint(1, {
        value: ethers.utils.parseEther("0.01")
      });
      expect(await nftCollection.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should fail to mint without payment", async function () {
      await expect(
        nftCollection.connect(addr1).mint(1)
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should not exceed max supply", async function () {
      await nftCollection.setMaxSupply(2);
      await nftCollection.connect(addr1).mint(2, {
        value: ethers.utils.parseEther("0.02")
      });
      await expect(
        nftCollection.connect(addr1).mint(1, {
          value: ethers.utils.parseEther("0.01")
        })
      ).to.be.revertedWith("Max supply reached");
    });

    it("Should update base URI", async function () {
      await nftCollection.connect(addr1).mint(1, {
        value: ethers.utils.parseEther("0.01")
      });
      await nftCollection.setBaseURI("https://newuri.com/");
      const tokenURI = await nftCollection.tokenURI(0);
      expect(tokenURI).to.equal("https://newuri.com/0");
    });

    it("Should withdraw funds", async function () {
      await nftCollection.connect(addr1).mint(1, {
        value: ethers.utils.parseEther("0.01")
      });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      await nftCollection.withdraw();
      const finalBalance = await ethers.provider.getBalance(owner.address);
      
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("NFTMarketplace", function () {
    beforeEach(async function () {
      // Mint NFT for testing
      await nftCollection.connect(addr1).mint(1, {
        value: ethers.utils.parseEther("0.01")
      });
      // Approve marketplace
      await nftCollection.connect(addr1).approve(marketplace.address, 0);
    });

    it("Should list NFT for sale", async function () {
      await marketplace.connect(addr1).listNFTForETH(
        nftCollection.address,
        0,
        ethers.utils.parseEther("1")
      );
      
      const listing = await marketplace.getListing(0);
      expect(listing.seller).to.equal(addr1.address);
      expect(listing.price).to.equal(ethers.utils.parseEther("1"));
      expect(listing.isActive).to.equal(true);
    });

    it("Should buy NFT with ETH", async function () {
      await marketplace.connect(addr1).listNFTForETH(
        nftCollection.address,
        0,
        ethers.utils.parseEther("1")
      );

      await marketplace.connect(addr2).buyNFTWithETH(0, {
        value: ethers.utils.parseEther("1")
      });

      expect(await nftCollection.ownerOf(0)).to.equal(addr2.address);
      const listing = await marketplace.getListing(0);
      expect(listing.isActive).to.equal(false);
    });

    it("Should cancel listing", async function () {
      await marketplace.connect(addr1).listNFTForETH(
        nftCollection.address,
        0,
        ethers.utils.parseEther("1")
      );

      await marketplace.connect(addr1).cancelListing(0);
      const listing = await marketplace.getListing(0);
      expect(listing.isActive).to.equal(false);
    });

    it("Should update listing price", async function () {
      await marketplace.connect(addr1).listNFTForETH(
        nftCollection.address,
        0,
        ethers.utils.parseEther("1")
      );

      await marketplace.connect(addr1).updateListingPrice(
        0,
        ethers.utils.parseEther("2")
      );

      const listing = await marketplace.getListing(0);
      expect(listing.price).to.equal(ethers.utils.parseEther("2"));
    });

    it("Should collect marketplace fees", async function () {
      await marketplace.connect(addr1).listNFTForETH(
        nftCollection.address,
        0,
        ethers.utils.parseEther("1")
      );

      const feeRecipient = await marketplace.feeRecipient();
      const initialBalance = await ethers.provider.getBalance(feeRecipient);

      await marketplace.connect(addr2).buyNFTWithETH(0, {
        value: ethers.utils.parseEther("1")
      });

      const finalBalance = await ethers.provider.getBalance(feeRecipient);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should list and buy NFT with ERC20", async function () {
      // Transfer tokens to buyer
      await token.transfer(addr2.address, ethers.utils.parseEther("1000"));
      
      // List NFT for ERC20
      await marketplace.connect(addr1).listNFTForERC20(
        nftCollection.address,
        0,
        ethers.utils.parseEther("100"),
        token.address
      );

      // Approve marketplace to spend tokens
      await token.connect(addr2).approve(
        marketplace.address,
        ethers.utils.parseEther("100")
      );

      // Buy NFT
      await marketplace.connect(addr2).buyNFTWithERC20(0);

      expect(await nftCollection.ownerOf(0)).to.equal(addr2.address);
    });
  });
});
