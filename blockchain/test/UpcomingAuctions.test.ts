import { expect } from "chai";
import { ethers } from "hardhat";
import { AuctionPlatform } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("AuctionPlatform - Upcoming Auctions", function () {
  let auctionPlatform: AuctionPlatform;
  let admin: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let bidder: HardhatEthersSigner;

  const STARTING_PRICE = ethers.parseEther("1");
  const DURATION = 3600; // 1 hour
  const PRODUCT_CID = "QmTest123";
  const BUY_NOW_PRICE = ethers.parseEther("2");
  const COLLATERAL = ethers.parseEther("0.1"); // 10% of 1 ETH

  beforeEach(async function () {
    [admin, seller, bidder] = await ethers.getSigners();

    const AuctionPlatformFactory = await ethers.getContractFactory("AuctionPlatform");
    auctionPlatform = await AuctionPlatformFactory.deploy();
    // No need to wait for deployment in newer ethers/hardhat? Actually it's better to wait.
    await auctionPlatform.waitForDeployment();
  });

  it("Should create an auction with a future startTime", async function () {
    const now = await time.latest();
    const startTime = now + 1000; // 1000 seconds in the future

    await auctionPlatform.connect(seller).createAuction(
      STARTING_PRICE,
      startTime,
      DURATION,
      PRODUCT_CID,
      BUY_NOW_PRICE,
      0, // ShippingPayer.Buyer
      { value: COLLATERAL }
    );

    const auction = await auctionPlatform.getAuctionCore(1);
    expect(auction.startTime).to.equal(startTime);
    expect(auction.endTime).to.equal(startTime + DURATION);
  });

  it("Should revert if bidding before startTime", async function () {
    const now = await time.latest();
    const startTime = now + 1000;

    await auctionPlatform.connect(seller).createAuction(
      STARTING_PRICE,
      startTime,
      DURATION,
      PRODUCT_CID,
      BUY_NOW_PRICE,
      0, // ShippingPayer.Buyer
      { value: COLLATERAL }
    );

    await expect(
      auctionPlatform.connect(bidder).bid(1, { value: STARTING_PRICE })
    ).to.be.revertedWith("AuctionPlatform: auction not yet started");
  });

  it("Should allow bidding after startTime", async function () {
    const now = await time.latest();
    const startTime = now + 1000;

    await auctionPlatform.connect(seller).createAuction(
      STARTING_PRICE,
      startTime,
      DURATION,
      PRODUCT_CID,
      BUY_NOW_PRICE,
      0, // ShippingPayer.Buyer
      { value: COLLATERAL }
    );

    // Warp time to startTime
    await time.increaseTo(startTime + 1);

    await expect(
      auctionPlatform.connect(bidder).bid(1, { value: STARTING_PRICE })
    ).to.not.be.reverted;

    const auction = await auctionPlatform.getAuctionCore(1);
    expect(auction.highestBidder).to.equal(bidder.address);
  });
});
