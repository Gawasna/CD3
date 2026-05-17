import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:7545');
  const abi = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/abi/AuctionPlatform.json'), 'utf8')).abi;
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS!, abi, provider);

  const auctionId = 1;
  const auction = await contract.getAuctionCore(auctionId);
  
  console.log(`On-Chain Data for Auction #${auctionId}:`);
  console.log(`- Seller: ${auction.seller}`);
  console.log(`- StartTime: ${new Date(Number(auction.startTime) * 1000).toISOString()} (${auction.startTime})`);
  console.log(`- EndTime: ${new Date(Number(auction.endTime) * 1000).toISOString()} (${auction.endTime})`);
  console.log(`- StartingPrice: ${ethers.formatEther(auction.startingPrice)} ETH`);
}

main().catch(console.error);
