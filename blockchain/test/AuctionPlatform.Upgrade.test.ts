import { expect } from "chai";
import { ethers } from "hardhat";
import { AuctionPlatform, Rejector } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("AuctionPlatform - Upgraded Features", function () {
  let auctionPlatform: AuctionPlatform;
  let admin: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let bidder1: HardhatEthersSigner;
  let bidder2: HardhatEthersSigner;

  const STARTING_PRICE = ethers.parseEther("1");
  const DURATION = 3600;
  const PRODUCT_CID = "QmTestUpgrade";
  const BUY_NOW_PRICE = ethers.parseEther("10");

  beforeEach(async function () {
    [admin, seller, bidder1, bidder2] = await ethers.getSigners();
    const AuctionPlatformFactory = await ethers.getContractFactory("AuctionPlatform");
    auctionPlatform = await AuctionPlatformFactory.deploy();
    await auctionPlatform.waitForDeployment();
  });

  describe("Flexible Economic Parameters", function () {
    it("Should allow admin to update economic parameters", async function () {
      const newCollateralBps = 500; // 5%
      const newMinBidIncrementBps = 200; // 2%
      const newMinCollateral = ethers.parseEther("0.001");
      const newPlatformFeeBps = 100; // 1%
      const newDisputeBond = ethers.parseEther("0.001");

      await auctionPlatform.connect(admin).setEconomicParams(
        newCollateralBps,
        newMinBidIncrementBps,
        newMinCollateral,
        newPlatformFeeBps,
        newDisputeBond
      );

      expect(await auctionPlatform.collateralBps()).to.equal(newCollateralBps);
      expect(await auctionPlatform.minBidIncrementBps()).to.equal(newMinBidIncrementBps);
      expect(await auctionPlatform.minCollateral()).to.equal(newMinCollateral);
      expect(await auctionPlatform.platformFeeBps()).to.equal(newPlatformFeeBps);
      expect(await auctionPlatform.disputeBond()).to.equal(newDisputeBond);
    });

    it("Should use new collateral logic for cheap items", async function () {
      await auctionPlatform.connect(admin).setEconomicParams(
        1000, // 10%
        500,  // 5%
        ethers.parseEther("0.001"), // Min collateral 0.001 ETH
        200,
        ethers.parseEther("0.005")
      );

      const cheapPrice = ethers.parseEther("0.005");
      const reqCollateral = await auctionPlatform.requiredCollateral(cheapPrice);
      expect(reqCollateral).to.equal(ethers.parseEther("0.001"));

      await expect(
        auctionPlatform.connect(seller).createAuction(
          cheapPrice,
          Math.floor(Date.now() / 1000) + 1000,
          DURATION,
          PRODUCT_CID,
          0,
          0,
          { value: ethers.parseEther("0.0005") }
        )
      ).to.be.revertedWith("AuctionPlatform: insufficient collateral");
    });
  });

  describe("Push-Pull Fallback and Credit-based Bidding", function () {
    let auctionId = 1;

    beforeEach(async function () {
      await auctionPlatform.connect(seller).createAuction(
        STARTING_PRICE,
        await time.latest() + 1,
        DURATION,
        PRODUCT_CID,
        BUY_NOW_PRICE,
        0,
        { value: ethers.parseEther("0.1") }
      );
      await time.increase(2);
      auctionId = Number(await auctionPlatform.auctionCount());
    });

    it("Should attempt to push refund to previous bidder", async function () {
      await auctionPlatform.connect(bidder1).bid(auctionId, { value: STARTING_PRICE });
      const balanceBefore = await ethers.provider.getBalance(bidder1.address);
      
      const higherBid = ethers.parseEther("1.1");
      await auctionPlatform.connect(bidder2).bid(auctionId, { value: higherBid });

      const balanceAfter = await ethers.provider.getBalance(bidder1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
      expect(await auctionPlatform.pendingReturns(bidder1.address)).to.equal(0n);
    });

    it("Should fallback to pull if push fails (using Rejector contract)", async function () {
      const RejectorFactory = await ethers.getContractFactory("Rejector");
      const rejector = await RejectorFactory.deploy();
      await rejector.waitForDeployment();
      await rejector.fund({ value: ethers.parseEther("2") });

      // Rejector bids
      await rejector.bid(await auctionPlatform.getAddress(), auctionId, STARTING_PRICE);
      
      // Bidder 2 outbids Rejector
      await auctionPlatform.connect(bidder2).bid(auctionId, { value: ethers.parseEther("1.2") });
      
      // Rejector rejects ETH, so funds should be in pendingReturns
      expect(await auctionPlatform.pendingReturns(await rejector.getAddress())).to.equal(STARTING_PRICE);
    });

    it("Should allow Credit-based Bidding using pendingReturns", async function () {
      const RejectorFactory = await ethers.getContractFactory("Rejector");
      const rejector = await RejectorFactory.deploy();
      await rejector.waitForDeployment();
      await rejector.fund({ value: ethers.parseEther("2") });

      await rejector.bid(await auctionPlatform.getAddress(), auctionId, STARTING_PRICE);
      await auctionPlatform.connect(bidder2).bid(auctionId, { value: ethers.parseEther("1.2") });
      
      // Now Rejector bids again. Higher bid needed > 1.2 * 1.05 = 1.26.
      // Rejector uses its 1.0 credit + 0.5 top-up = 1.5 total bid.
      const topUp = ethers.parseEther("0.5");
      await rejector.bid(await auctionPlatform.getAddress(), auctionId, topUp);
      
      const auction = await auctionPlatform.getAuctionCore(auctionId);
      expect(auction.highestBid).to.equal(ethers.parseEther("1.5"));
      expect(auction.highestBidder).to.equal(await rejector.getAddress());
      expect(await auctionPlatform.pendingReturns(await rejector.getAddress())).to.equal(0n);
    });
  });
  
  describe("Batch Withdraw", function () {
    it("Should allow withdrawing all pending returns", async function () {
      const RejectorFactory = await ethers.getContractFactory("Rejector");
      const rejector = await RejectorFactory.deploy();
      await rejector.waitForDeployment();
      await rejector.fund({ value: ethers.parseEther("2") });
      
      // Create auction and bid
      await auctionPlatform.connect(seller).createAuction(
        STARTING_PRICE, await time.latest() + 1, DURATION, PRODUCT_CID, BUY_NOW_PRICE, 0,
        { value: ethers.parseEther("0.1") }
      );
      await time.increase(2);
      const auctionId = Number(await auctionPlatform.auctionCount());

      await rejector.bid(await auctionPlatform.getAddress(), auctionId, STARTING_PRICE);
      await auctionPlatform.connect(bidder2).bid(auctionId, { value: ethers.parseEther("1.2") });
      
      expect(await auctionPlatform.pendingReturns(await rejector.getAddress())).to.equal(STARTING_PRICE);
      
      // Rejector cannot withdraw directly (reverts), but we can check if it tries
      await expect(rejector.withdrawAll(await auctionPlatform.getAddress())).to.be.revertedWith("WithdrawAll failed");
      
      // Check bidder1 (wallet)
      await auctionPlatform.connect(bidder1).bid(auctionId, { value: ethers.parseEther("1.5") });
      // Outbid bidder1 -> push succeeds, nothing in pendingReturns
      await auctionPlatform.connect(bidder2).bid(auctionId, { value: ethers.parseEther("2.0") });
      
      expect(await auctionPlatform.pendingReturns(bidder1.address)).to.equal(0n);
    });
  });
});
