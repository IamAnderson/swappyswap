import { ethers } from "hardhat";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const tokens = (n: number): BigNumber => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Token", () => {
  let token: Contract;
  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    //@ts-ignore
    token = await Token.deploy("TokenX", "TKX", "1000000");

    //@ts-ignore
    accounts = await ethers.getSigners();
    deployer = accounts?.[0];
    receiver = accounts?.[1];
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

  describe("Sending Tokens", () => {
    let amount: BigNumber;
    let transaction: any;
    let result: any;

    describe("Success", () => {
        beforeEach(async () => {
          amount = tokens(100);
        });
    
        it("transfers token balances", async () => {
          const { expect } = await import("chai");
          // Transfer tokens
          transaction = await token.connect(deployer).transfer(receiver, amount);
          result = await transaction.wait();
    
          // Ensure that tokens were transferred
          expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900));
          expect(await token.balanceOf(receiver.address)).to.equal(amount);
        });
    
        it("emits a transfer event", async () => {
            const { expect } = await import("chai");
    
            const loggedEvent = result.events?.[0];
            expect(loggedEvent?.event).to.equal("Transfer");
            
            const args = loggedEvent?.args;
            expect(args._from).to.equal(deployer.address);
            expect(args._to).to.equal(receiver.address);
            expect(args._value).to.equal(amount);
        });
    });

    describe("Failure", () => {
        it("rejects insufficent balances", async() => {
            const { expect } = await import("chai");
            const invalidAmount = tokens(1000000000000);
            expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
        
        it("rejects invalid reciepient", async() => {
            const { expect } = await import("chai");
            const amount = tokens(100);
            expect(token.connect(deployer).transfer("0x0000000000000000000000000000000", amount)).to.be.reverted!;
        });
        
    });

  });
});
