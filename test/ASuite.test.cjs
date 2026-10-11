// Tests de los 10 tokens de la A-Suite.
// Los datos (nombre y supply) salen de frontend/src/data/tokens.js.
const { expect } = require("chai");
const { ethers } = require("hardhat");

const TOKENS = [
  { t: "AGOV", name: "A-Gobernanza", supply: 50000000n, votes: true },
  { t: "AUTI", name: "A-Utilidad", supply: 100000000n, votes: false },
  { t: "APAY", name: "A-Pago", supply: 200000000n, votes: false },
  { t: "ARES", name: "A-Reserva", supply: 150000000n, votes: false },
  { t: "A1GOV", name: "A1-Gobernanza", supply: 30000000n, votes: true },
  { t: "A1UTI", name: "A1-Utilidad", supply: 75000000n, votes: false },
  { t: "A1PAY", name: "A1-Pago", supply: 180000000n, votes: false },
  { t: "AXGOV", name: "AX-Gobernanza", supply: 25000000n, votes: true },
  { t: "AXPAY", name: "AX-Pago", supply: 160000000n, votes: false },
  { t: "AXRES", name: "AX-Reserva", supply: 120000000n, votes: false },
];

describe("A-Suite (10 tokens ERC-20)", function () {
  it("la lista cubre los 10 tokens de la suite", function () {
    expect(TOKENS.length).to.equal(10);
  });

  for (const { t, name, supply, votes } of TOKENS) {
    describe(t + " (" + name + ")", function () {
      let token;
      let owner;
      let otro;

      beforeEach(async function () {
        [owner, otro] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory(t);
        token = await Factory.deploy();
        await token.waitForDeployment();
      });

      it("nombre y simbolo correctos", async function () {
        expect(await token.name()).to.equal(name);
        expect(await token.symbol()).to.equal(t);
      });

      it("supply inicial completo al desplegador, 18 decimales", async function () {
        const esperado = ethers.parseEther(supply.toString());
        expect(await token.totalSupply()).to.equal(esperado);
        expect(await token.balanceOf(owner.address)).to.equal(esperado);
        expect(await token.decimals()).to.equal(18);
      });

      it("transfiere y permite transferFrom con allowance", async function () {
        const monto = ethers.parseEther("1000");
        await token.transfer(otro.address, monto);
        expect(await token.balanceOf(otro.address)).to.equal(monto);

        await token.connect(otro).approve(owner.address, monto);
        await token.transferFrom(otro.address, owner.address, monto);
        expect(await token.balanceOf(otro.address)).to.equal(0n);
      });

      it("solo el propietario puede acunar", async function () {
        await expect(token.connect(otro).mint(otro.address, 1n)).to.be.reverted;
      });

      if (votes) {
        it("cuenta el poder de voto al delegar (ERC20Votes)", async function () {
          await token.delegate(owner.address);
          expect(await token.getVotes(owner.address)).to.equal(
            ethers.parseEther(supply.toString())
          );
        });
      } else {
        it("se puede pausar y reanudar la transferencia", async function () {
          await token.pause();
          await expect(token.transfer(otro.address, 1n)).to.be.reverted;
          await token.unpause();
          await token.transfer(otro.address, ethers.parseEther("1"));
          expect(await token.balanceOf(otro.address)).to.equal(
            ethers.parseEther("1")
          );
        });
      }
    });
  }
});
