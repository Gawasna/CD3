import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const [signer] = await ethers.getSigners();
  
  const AuctionPlatform = await ethers.getContractAt("AuctionPlatform", contractAddress);
  
  const startingPrice = ethers.parseEther("0.121");
  const startTime = 1779012240; // From original error log
  const duration = 86400;
  const productCid = JSON.stringify(["auction-1778925924645-107621484.jpg"]);
  const buyNowPrice = 0;
  
  const collateralBps = 1000n;
  const calcCollateral = (startingPrice * collateralBps) / 10000n;
  const minCollateral = ethers.parseEther("0.01");
  const requiredCollateral = calcCollateral > minCollateral ? calcCollateral : minCollateral;
  
  console.log("Simulating with original parameters:");
  console.log("- startingPrice:", startingPrice.toString());
  console.log("- startTime:", startTime);
  console.log("- duration:", duration);
  console.log("- productCid:", productCid);
  console.log("- requiredCollateral:", requiredCollateral.toString());
  
  try {
    const tx = await AuctionPlatform.createAuction.staticCall(
      startingPrice,
      startTime,
      duration,
      productCid,
      buyNowPrice,
      { value: requiredCollateral, gasLimit: 30000000 }
    );
    console.log("Simulation Success!");
  } catch (error: any) {
    console.error("Simulation Failed!");
    if (error.reason) console.error("Reason:", error.reason);
    if (error.message) console.error("Message:", error.message);
    if (error.data) console.error("Data:", error.data);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
