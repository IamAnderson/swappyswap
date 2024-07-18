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

  let token1: Contract; //Address of token 1
  let token2: Contract; //Address of token 1

  let user1: SignerWithAddress; // Address of person approving token to the exchange and making transactions through the exchange
  let user2: SignerWithAddress;

  const feePercent = 10;
  const amount = tokens(100);

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    const Exchange = await ethers.getContractFactory("Exchange");

    //@ts-ignore
    accounts = await ethers.getSigners();
    deployer = accounts?.[0];
    feeAccount = accounts?.[1];
    user1 = accounts?.[2];
    user2 = accounts?.[3];

    //@ts-ignore
    token1 = await Token.deploy("With Ease", "WEZ", "1000000");
    //@ts-ignore
    token2 = await Token.deploy("With Ease", "WEZ", "1000000");

    exchange = await Exchange.deploy(feeAccount.address, feePercent);

    let transaction = await token1
      .connect(deployer)
      .transfer(user1.address, tokens(100));
    await transaction.wait();
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
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(
          amount
        );
        expect(
          await exchange.balanceOf(token1.address, user1.address)
        ).to.equal(amount);
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
        await expect(
          exchange.connect(user1).depositToken(token1.address, amount)
        ).to.be.revertedWith("DEPOSIT ERROR: Tokens must be approved first");
      });
    });
  });

  describe("Withdraw Tokens", () => {
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
      //Withdwat tokes
      transaction = await exchange
        .connect(user1)
        .withdraw(token1.address, amount);
      result = await transaction.wait();
    });

    describe("Success", () => {
      it("withdraws token funds", async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(0);
        expect(await exchange.token(token1.address, user1.address)).to.equal(0);
        expect(
          await exchange.balanceOf(token1.address, user1.address)
        ).to.equal(0);
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
        await expect(
          exchange.connect(user1).withdraw(token1.address, invalidAmount)
        ).to.be.revertedWith(
          "WITHDRAW ERROR: Tokens balance is less than amount"
        );
      });
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
      expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(
        1
      );
    });
  });

  describe("Making Order", () => {
    let transaction;
    let result: any;

    let amount = tokens(1);

    describe("Success", () => {
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

        // Make Order
        transaction = await exchange
          .connect(user1)
          .makeOrder(token2.address, amount, token1.address, amount);
        result = await transaction.wait();
      });

      it("tracks the newly created order", async () => {
        expect(await exchange.orderCount()).to.equal(1);
      });

      it("emits a order event", async () => {
        const loggedEvent = result?.events?.[0];
        expect(loggedEvent?.event).to.equal("Order");

        const args = loggedEvent?.args;
        expect(args.id).to.equal(1);
        expect(args.user).to.equal(user1.address);
        expect(args.tokenGet).to.equal(token2.address);
        expect(args.amountGet).to.equal(1);
        expect(args.tokenGive).to.equal(token1.address);
        expect(args.amountGive).to.equal(1);
        expect(args.timeStamp).to.at.least(1);
      });
    });

    describe("Failure", () => {
      it("Rejects with no balance", async () => {
        expect(
          await exchange
            .connect(user1)
            .makeOrder(token2.address, tokens(1), token1.address, tokens(1))
        ).to.be.revertedWith("No balance found");
      });
    });
  });

  describe("Order actions", () => {
    let transaction;
    let result: any;

    let amount = tokens(1);

    describe("Cancelling Order", () => {
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

        // Make Order
        transaction = await exchange
          .connect(user1)
          .makeOrder(token2.address, amount, token1.address, amount);
        result = await transaction.wait();
      });

      describe("Success", () => {
        beforeEach(async () => {
          transaction = exchange.connect(user1).cancelOrder(1);
          result = await transaction.wait();
        });

        it("updates cancelled orders", async () => {
          expect(await exchange.orderCancelled(1)).to.equal(true);
        });
  
        it("emits a order event", async () => {
          const loggedEvent = result?.events?.[0];
          expect(loggedEvent?.event).to.equal("Order");
  
          const args = loggedEvent?.args;
          expect(args.id).to.equal(1);
          expect(args.user).to.equal(user1.address);
          expect(args.tokenGet).to.equal(token2.address);
          expect(args.amountGet).to.equal(1);
          expect(args.tokenGive).to.equal(token1.address);
          expect(args.amountGive).to.equal(1);
          expect(args.timeStamp).to.at.least(1);
        });
      });
  
      describe("Failure", () => {
        it("Rejects invalid order ids", async () => {
          const invalidOrderId = 9999;
          expect(await exchange.connect(user1).cancelOrder(invalidOrderId)).to.be.revertedWith("Invalid order Id")
        });

        it("Rejects unauthorized cancelations", async () => {
          expect(await exchange.connect(user2).cancelOrder(1)).to.be.revertedWith("Unauthorized to cancel order")
        });
      });
    });

  });
  
});
