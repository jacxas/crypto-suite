const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { deployToken, deployNFT, deployMultiContract } = require("./helpers/testHelpers");

describe("MultiContract", function () {
  let multiContract;
  let nft;
  let token;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    // Deploy token and NFT
    token = await deployToken("TestToken", "TT", INITIAL_SUPPLY);
    nft = await deployNFT("TestNFT", "TNFT", "https://api.test.com/");
    
    // Deploy MultiContract
    multiContract = await deployMultiContract(
      await nft.getAddress(),
      await token.getAddress()
    );
    
    // Mint NFT to owner
    await nft.mintNFT("metadata1.json");
  });

  describe("Deployment", function () {
    it("Should set the correct NFT contract", async function () {
      expect(await multiContract.nft()).to.equal(await nft.getAddress());
    });

    it("Should set the correct token contract", async function () {
      expect(await multiContract.token()).to.equal(await token.getAddress());
    });

    it("Should set owner as first signer", async function () {
      expect(await multiContract.isOwner(owner.address)).to.be.true;
    });

    it("Should set required signatures to 1", async function () {
      expect(await multiContract.requiredSignatures()).to.equal(1);
    });
  });

  describe("Multi-Signature Management", function () {
    describe("Adding Signers", function () {
      it("Should allow owner to add signer", async function () {
        await multiContract.addSigner(addr1.address);
        expect(await multiContract.isOwner(addr1.address)).to.be.true;
      });

      it("Should emit SignerAdded event", async function () {
        await expect(multiContract.addSigner(addr1.address))
          .to.emit(multiContract, "SignerAdded")
          .withArgs(addr1.address);
      });

      it("Should fail if not owner", async function () {
        await expect(
          multiContract.connect(addr1).addSigner(addr2.address)
        ).to.be.reverted;
      });

      it("Should fail if already a signer", async function () {
        await multiContract.addSigner(addr1.address);
        await expect(
          multiContract.addSigner(addr1.address)
        ).to.be.revertedWith("Already a signer");
      });

      it("Should increment owner count", async function () {
        const countBefore = await multiContract.getOwnerCount();
        await multiContract.addSigner(addr1.address);
        const countAfter = await multiContract.getOwnerCount();
        expect(countAfter).to.equal(countBefore + 1n);
      });
    });

    describe("Removing Signers", function () {
      beforeEach(async function () {
        await multiContract.addSigner(addr1.address);
        await multiContract.addSigner(addr2.address);
      });

      it("Should allow owner to remove signer", async function () {
        await multiContract.removeSigner(addr1.address);
        expect(await multiContract.isOwner(addr1.address)).to.be.false;
      });

      it("Should emit SignerRemoved event", async function () {
        await expect(multiContract.removeSigner(addr1.address))
          .to.emit(multiContract, "SignerRemoved")
          .withArgs(addr1.address);
      });

      it("Should fail if not owner", async function () {
        await expect(
          multiContract.connect(addr3).removeSigner(addr1.address)
        ).to.be.reverted;
      });

      it("Should fail if not a signer", async function () {
        await expect(
          multiContract.removeSigner(addr3.address)
        ).to.be.revertedWith("Not a signer");
      });

      it("Should decrement owner count", async function () {
        const countBefore = await multiContract.getOwnerCount();
        await multiContract.removeSigner(addr1.address);
        const countAfter = await multiContract.getOwnerCount();
        expect(countAfter).to.equal(countBefore - 1n);
      });
    });

    describe("Changing Required Signatures", function () {
      beforeEach(async function () {
        await multiContract.addSigner(addr1.address);
        await multiContract.addSigner(addr2.address);
      });

      it("Should allow owner to change required signatures", async function () {
        await multiContract.changeRequiredSignatures(2);
        expect(await multiContract.requiredSignatures()).to.equal(2);
      });

      it("Should emit RequiredSignaturesChanged event", async function () {
        await expect(multiContract.changeRequiredSignatures(2))
          .to.emit(multiContract, "RequiredSignaturesChanged")
          .withArgs(2);
      });

      it("Should fail if not owner", async function () {
        await expect(
          multiContract.connect(addr3).changeRequiredSignatures(2)
        ).to.be.reverted;
      });

      it("Should fail if required > owner count", async function () {
        await expect(
          multiContract.changeRequiredSignatures(10)
        ).to.be.revertedWith("Invalid required signatures");
      });

      it("Should fail if required is 0", async function () {
        await expect(
          multiContract.changeRequiredSignatures(0)
        ).to.be.revertedWith("Invalid required signatures");
      });
    });
  });

  describe("NFT Escrow", function () {
    beforeEach(async function () {
      // Approve and transfer NFT to escrow
      await nft.approve(await multiContract.getAddress(), 0);
    });

    describe("Depositing NFTs", function () {
      it("Should allow depositing NFT to escrow", async function () {
        await multiContract.depositNFT(0, addr1.address);
        
        const escrow = await multiContract.escrows(0);
        expect(escrow.tokenId).to.equal(0);
        expect(escrow.depositor).to.equal(owner.address);
        expect(escrow.beneficiary).to.equal(addr1.address);
        expect(escrow.released).to.be.false;
      });

      it("Should transfer NFT to contract", async function () {
        await multiContract.depositNFT(0, addr1.address);
        expect(await nft.ownerOf(0)).to.equal(await multiContract.getAddress());
      });

      it("Should emit NFTDeposited event", async function () {
        await expect(multiContract.depositNFT(0, addr1.address))
          .to.emit(multiContract, "NFTDeposited")
          .withArgs(0, owner.address, addr1.address);
      });

      it("Should fail if not approved", async function () {
        await nft.mintNFT("metadata2.json");
        await expect(
          multiContract.depositNFT(1, addr1.address)
        ).to.be.reverted;
      });
    });

    describe("Releasing NFTs", function () {
      beforeEach(async function () {
        await multiContract.depositNFT(0, addr1.address);
      });

      it("Should allow depositor to release NFT", async function () {
        await multiContract.releaseNFT(0);
        
        const escrow = await multiContract.escrows(0);
        expect(escrow.released).to.be.true;
        expect(await nft.ownerOf(0)).to.equal(addr1.address);
      });

      it("Should emit NFTReleased event", async function () {
        await expect(multiContract.releaseNFT(0))
          .to.emit(multiContract, "NFTReleased")
          .withArgs(0, addr1.address);
      });

      it("Should fail if not depositor", async function () {
        await expect(
          multiContract.connect(addr2).releaseNFT(0)
        ).to.be.revertedWith("Not depositor");
      });

      it("Should fail if already released", async function () {
        await multiContract.releaseNFT(0);
        await expect(
          multiContract.releaseNFT(0)
        ).to.be.revertedWith("Already released");
      });
    });

    describe("Refunding NFTs", function () {
      beforeEach(async function () {
        await multiContract.depositNFT(0, addr1.address);
      });

      it("Should allow depositor to refund NFT", async function () {
        await multiContract.refundNFT(0);
        
        const escrow = await multiContract.escrows(0);
        expect(escrow.released).to.be.true;
        expect(await nft.ownerOf(0)).to.equal(owner.address);
      });

      it("Should emit NFTRefunded event", async function () {
        await expect(multiContract.refundNFT(0))
          .to.emit(multiContract, "NFTRefunded")
          .withArgs(0, owner.address);
      });

      it("Should fail if not depositor", async function () {
        await expect(
          multiContract.connect(addr2).refundNFT(0)
        ).to.be.revertedWith("Not depositor");
      });

      it("Should fail if already released", async function () {
        await multiContract.releaseNFT(0);
        await expect(
          multiContract.refundNFT(0)
        ).to.be.revertedWith("Already released");
      });
    });
  });

  describe("Multi-Signature Transactions", function () {
    beforeEach(async function () {
      // Add signers and set required signatures to 2
      await multiContract.addSigner(addr1.address);
      await multiContract.addSigner(addr2.address);
      await multiContract.changeRequiredSignatures(2);
      
      // Give contract some tokens
      await token.transfer(await multiContract.getAddress(), ethers.parseEther("1000"));
    });

    describe("Submitting Transactions", function () {
      it("Should allow signer to submit transaction", async function () {
        const amount = ethers.parseEther("100");
        
        await multiContract.submitTransaction(addr3.address, amount);
        
        const tx = await multiContract.transactions(0);
        expect(tx.to).to.equal(addr3.address);
        expect(tx.amount).to.equal(amount);
        expect(tx.executed).to.be.false;
        expect(tx.signatureCount).to.equal(1);
      });

      it("Should emit TransactionSubmitted event", async function () {
        const amount = ethers.parseEther("100");
        
        await expect(multiContract.submitTransaction(addr3.address, amount))
          .to.emit(multiContract, "TransactionSubmitted")
          .withArgs(0, addr3.address, amount);
      });

      it("Should automatically sign by submitter", async function () {
        const amount = ethers.parseEther("100");
        await multiContract.submitTransaction(addr3.address, amount);
        
        expect(await multiContract.hasSigned(0, owner.address)).to.be.true;
      });

      it("Should fail if not a signer", async function () {
        await expect(
          multiContract.connect(addr3).submitTransaction(addr3.address, ethers.parseEther("100"))
        ).to.be.revertedWith("Not a signer");
      });
    });

    describe("Signing Transactions", function () {
      beforeEach(async function () {
        await multiContract.submitTransaction(addr3.address, ethers.parseEther("100"));
      });

      it("Should allow signer to sign transaction", async function () {
        await multiContract.connect(addr1).signTransaction(0);
        
        expect(await multiContract.hasSigned(0, addr1.address)).to.be.true;
        const tx = await multiContract.transactions(0);
        expect(tx.signatureCount).to.equal(2);
      });

      it("Should emit TransactionSigned event", async function () {
        await expect(multiContract.connect(addr1).signTransaction(0))
          .to.emit(multiContract, "TransactionSigned")
          .withArgs(0, addr1.address);
      });

      it("Should fail if not a signer", async function () {
        await expect(
          multiContract.connect(addr3).signTransaction(0)
        ).to.be.revertedWith("Not a signer");
      });

      it("Should fail if already signed", async function () {
        await expect(
          multiContract.signTransaction(0)
        ).to.be.revertedWith("Already signed");
      });

      it("Should fail if already executed", async function () {
        await multiContract.connect(addr1).signTransaction(0);
        await multiContract.executeTransaction(0);
        
        await expect(
          multiContract.connect(addr2).signTransaction(0)
        ).to.be.revertedWith("Already executed");
      });
    });

    describe("Executing Transactions", function () {
      beforeEach(async function () {
        await multiContract.submitTransaction(addr3.address, ethers.parseEther("100"));
        await multiContract.connect(addr1).signTransaction(0);
      });

      it("Should execute transaction with enough signatures", async function () {
        const balanceBefore = await token.balanceOf(addr3.address);
        
        await multiContract.executeTransaction(0);
        
        const balanceAfter = await token.balanceOf(addr3.address);
        expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("100"));
      });

      it("Should mark transaction as executed", async function () {
        await multiContract.executeTransaction(0);
        
        const tx = await multiContract.transactions(0);
        expect(tx.executed).to.be.true;
      });

      it("Should emit TransactionExecuted event", async function () {
        await expect(multiContract.executeTransaction(0))
          .to.emit(multiContract, "TransactionExecuted")
          .withArgs(0);
      });

      it("Should fail if not enough signatures", async function () {
        await multiContract.submitTransaction(addr3.address, ethers.parseEther("50"));
        
        await expect(
          multiContract.executeTransaction(1)
        ).to.be.revertedWith("Not enough signatures");
      });

      it("Should fail if already executed", async function () {
        await multiContract.executeTransaction(0);
        
        await expect(
          multiContract.executeTransaction(0)
        ).to.be.revertedWith("Already executed");
      });
    });

    describe("Revoking Signatures", function () {
      beforeEach(async function () {
        await multiContract.submitTransaction(addr3.address, ethers.parseEther("100"));
        await multiContract.connect(addr1).signTransaction(0);
      });

      it("Should allow signer to revoke signature", async function () {
        await multiContract.connect(addr1).revokeSignature(0);
        
        expect(await multiContract.hasSigned(0, addr1.address)).to.be.false;
        const tx = await multiContract.transactions(0);
        expect(tx.signatureCount).to.equal(1);
      });

      it("Should emit SignatureRevoked event", async function () {
        await expect(multiContract.connect(addr1).revokeSignature(0))
          .to.emit(multiContract, "SignatureRevoked")
          .withArgs(0, addr1.address);
      });

      it("Should fail if not signed", async function () {
        await expect(
          multiContract.connect(addr2).revokeSignature(0)
        ).to.be.revertedWith("Not signed");
      });

      it("Should fail if already executed", async function () {
        await multiContract.executeTransaction(0);
        
        await expect(
          multiContract.connect(addr1).revokeSignature(0)
        ).to.be.revertedWith("Already executed");
      });
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await multiContract.addSigner(addr1.address);
      await multiContract.addSigner(addr2.address);
    });

    it("Should return correct owner count", async function () {
      expect(await multiContract.getOwnerCount()).to.equal(3);
    });

    it("Should return all owners", async function () {
      const owners = await multiContract.getOwners();
      expect(owners.length).to.equal(3);
      expect(owners).to.include(owner.address);
      expect(owners).to.include(addr1.address);
      expect(owners).to.include(addr2.address);
    });

    it("Should return transaction count", async function () {
      await token.transfer(await multiContract.getAddress(), ethers.parseEther("1000"));
      
      await multiContract.submitTransaction(addr3.address, ethers.parseEther("100"));
      await multiContract.submitTransaction(addr3.address, ethers.parseEther("200"));
      
      expect(await multiContract.getTransactionCount()).to.equal(2);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle single signer scenario", async function () {
      await token.transfer(await multiContract.getAddress(), ethers.parseEther("1000"));
      
      await multiContract.submitTransaction(addr1.address, ethers.parseEther("100"));
      await multiContract.executeTransaction(0);
      
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should handle multiple pending transactions", async function () {
      await multiContract.addSigner(addr1.address);
      await multiContract.changeRequiredSignatures(2);
      await token.transfer(await multiContract.getAddress(), ethers.parseEther("1000"));
      
      // Submit multiple transactions
      await multiContract.submitTransaction(addr3.address, ethers.parseEther("100"));
      await multiContract.submitTransaction(addr3.address, ethers.parseEther("200"));
      await multiContract.submitTransaction(addr3.address, ethers.parseEther("300"));
      
      // Sign and execute middle transaction
      await multiContract.connect(addr1).signTransaction(1);
      await multiContract.executeTransaction(1);
      
      // Verify other transactions still pending
      const tx0 = await multiContract.transactions(0);
      const tx2 = await multiContract.transactions(2);
      expect(tx0.executed).to.be.false;
      expect(tx2.executed).to.be.false;
    });

    it("Should handle removing signer with pending signatures", async function () {
      await multiContract.addSigner(addr1.address);
      await multiContract.changeRequiredSignatures(2);
      await token.transfer(await multiContract.getAddress(), ethers.parseEther("1000"));
      
      await multiContract.submitTransaction(addr3.address, ethers.parseEther("100"));
      await multiContract.connect(addr1).signTransaction(0);
      
      // Remove signer
      await multiContract.removeSigner(addr1.address);
      
      // Transaction should still have 2 signatures but addr1 is no longer a signer
      const tx = await multiContract.transactions(0);
      expect(tx.signatureCount).to.equal(2);
      expect(await multiContract.isOwner(addr1.address)).to.be.false;
    });
  });
});
