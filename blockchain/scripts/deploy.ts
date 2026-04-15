/**
 * Deploy script — AuctionPlatform to Ganache local network
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network ganache
 *
 * Sau khi chạy xong: copy CONTRACT_ADDRESS vào
 *   - blockchain/.env
 *   - backend/.env
 *   - frontend/.env.local
 */

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Deploy AuctionPlatform
  const AuctionPlatform = await ethers.getContractFactory("AuctionPlatform");
  const contract = await AuctionPlatform.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const network = await ethers.provider.getNetwork();

  console.log("\n=== DEPLOYMENT SUCCESS ===");
  console.log("Contract:    AuctionPlatform");
  console.log("Address:    ", contractAddress);
  console.log("Network:    ", network.name, `(chainId: ${network.chainId})`);
  console.log("Block:      ", await ethers.provider.getBlockNumber());
  console.log("Admin:      ", deployer.address);

  // Copy ABI artifact to backend and frontend for easy access
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "AuctionPlatform.sol",
    "AuctionPlatform.json"
  );

  const backendAbiDir = path.join(__dirname, "..", "..", "backend", "src", "abi");
  const frontendAbiDir = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "src",
    "services",
    "blockchain",
    "abi"
  );

  [backendAbiDir, frontendAbiDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(artifactPath)) {
      fs.copyFileSync(artifactPath, path.join(dir, "AuctionPlatform.json"));
      console.log(`ABI copied to: ${dir}`);
    }
  });

  // Print instructions for updating .env files
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Update backend/.env:");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`   RPC_URL=http://127.0.0.1:7545`);
  console.log("");
  console.log("2. Update frontend/.env.local:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`   NEXT_PUBLIC_CHAIN_ID=${network.chainId}`);
  console.log("");
  console.log("3. Import Ganache network into MetaMask:");
  console.log("   Network name: Ganache Local");
  console.log("   RPC URL:      http://127.0.0.1:7545");
  console.log(`   Chain ID:     ${network.chainId}`);
  console.log("   Currency:     ETH");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
