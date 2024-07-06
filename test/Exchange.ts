import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const tokens = (n: number): BigNumber => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Exchange", () => {
  let exchange: Contract;
  let accounts: SignerWithAddress[];

  let deployer: SignerWithAddress;
  let feeAccount: SignerWithAddress; //Address of exchange's fee account

  let token1: Contract; //Address of token
  let user1: SignerWithAddress; // Address of person approving token to the exchange and making transactions through the exchange

  const feePercent = 10;
  const amount = tokens(100);

  beforeEach(async () => {
    //@ts-ignore
    accounts = await ethers.getSigners();
    deployer = accounts?.[0];
    feeAccount = accounts?.[1];
    user1 = accounts?.[2];

    const Exchange = await ethers.getContractFactory("Exchange");
    exchange = await Exchange.deploy(feeAccount.address, feePercent);

    let transaction = await token1
      .connect(user1)
      .depositToken(token1.address, amount);
    await transaction.wait();

    const Token = await ethers.getContractFactory("Token");
    //@ts-ignore
    token1 = await Token.deploy("With Ease", "WEZ", "1000000");
  });

  describe("Deployment", () => {
    it("tracks the fee account", async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address);
    });

    it("tracks the fee percent", async () => {
      expect(await exchange.feePercent()).to.equal(feePercent);
    });
  });

  describe("Depositing Tokens", () => {
    let transaction;
    let result: any;

    beforeEach(async () => {
      //Approve Token
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount);
      result = await transaction.wait();

      //Deposit Token
      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount);
      result = await transaction.wait();
    });

    describe("Success", () => {
      it("tracks the token deposit", async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(amount);
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount);
        expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount);
      });

      it("emits a deposit event", async () => {

        const loggedEvent = result?.events?.[1]; //2 events are emitted
        expect(loggedEvent?.event).to.equal("Deposit");

        const args = loggedEvent?.args;
        expect(args.token).to.equal(token1.address);
        expect(args.user).to.equal(user1.address);
        expect(args.amount).to.equal(amount);
        expect(args.balance).to.equal(amount);
      });
    });

    describe("Failure", () => {
      it("fails when no tokens are approved", async () => {
        await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.revertedWith("DEPOSIT ERROR: Tokens must be approved first");
      })
    });
  });

  describe("Withdraw Tokens", () => {
    let transaction;
    let result: any;

    beforeEach(async() => {
      //Approve Token
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount);
      result = await transaction.wait();

      //Deposit Token
      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount);
      result = await transaction.wait();
      //Withdwat tokes
      transaction = await exchange.connect(user1).withdraw(token1.address, amount);
      result = await transaction.wait();
    });

    describe("Success", () => {
      it("withdraws token funds", async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(0);
        expect(await exchange.token(token1.address, user1.address)).to.equal(0);
        expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0);
      });

      it("emits a withdraw event", async () => {

        const loggedEvent = result?.events?.[1]; //2 events are emitted
        expect(loggedEvent?.event).to.equal("Withdraw");

        const args = loggedEvent?.args;
        expect(args.token).to.equal(token1.address);
        expect(args.user).to.equal(user1.address);
        expect(args.amount).to.equal(amount);
        expect(args.balance).to.equal(0);
      });
    });

    describe("Failure", () => {
      const invalidAmount = 1000000000;
      it("fails for insufficient balance", async () => {
        await expect(exchange.connect(user1).withdraw(token1.address, invalidAmount)).to.be.revertedWith("WITHDRAW ERROR: Tokens balance is less than amount");
      })
    });
  });

  describe("Checking Balances", () => {
    let transaction;
    let amount = tokens(1);
    let result: any;

    beforeEach(async () => {
      //Approve Token
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount);
      result = await transaction.wait();

      //Deposit Token
      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount);
      result = await transaction.wait();
    });

    it("returns user balance", async () => {
      expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(1);
    });
  });  
});
