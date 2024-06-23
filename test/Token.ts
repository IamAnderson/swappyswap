import { ethers } from "hardhat";

const tokens = (n: number) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Token", () => {
  let token: any;
  let accounts: any;
  let deployer: any;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    //@ts-ignore
    token = await Token.deploy("TokenX", "TKX", "1000000");

    accounts = await ethers.getSigners();
    deployer = accounts?.[0];
  });

  describe("Deployment", () => {
    const name = "TokenX";
    const symbol = "TKX";
    const decimals = "18";
    const totalSupply = tokens(1000000);

    it("has correct name", async () => {
      const { expect } = await import("chai");
      expect(await token.name()).to.equal(name);
    });

    it("has correct symbol", async () => {
      const { expect } = await import("chai");
      expect(await token.symbol()).to.equal(symbol);
    });

    it("has correct decimals", async () => {
      const { expect } = await import("chai");
      expect(await token.decimals()).to.equal(decimals);
    });

    it("has correct total supply", async () => {
      const { expect } = await import("chai");
      expect(await token.totalSupply()).to.equal(totalSupply);
    });

    it("assigns total supply to deployer", async () => {
      const { expect } = await import("chai");
      expect(await token.balanceOf(deployer.address)).to.equal(totalSupply);
    });
  });
});
