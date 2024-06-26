import { ethers } from "hardhat";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const tokens = (n: number): BigNumber => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Exchange", () => {
  let exchange: Contract;
  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let feeAccount: SignerWithAddress;

  const feePercent = 10;

  beforeEach(async () => {
    //@ts-ignore
    accounts = await ethers.getSigners();
    deployer = accounts?.[0];
    feeAccount = accounts?.[1];

    const Exchange = await ethers.getContractFactory("Exchange");
    exchange = await Exchange.deploy(feeAccount.address, feePercent);
  });

  describe("Deployment", () => {
    it("tracks the fee account", async () => {
      const { expect } = await import("chai");
      expect(await exchange.feeAccount()).to.equal(feeAccount.address);
    });

    it("tracks the fee percent", async () => {
        const { expect } = await import("chai");
        expect(await exchange.feePercent()).to.equal(feePercent);
      });
  });
});
