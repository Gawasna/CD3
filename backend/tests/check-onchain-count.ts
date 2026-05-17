import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:7545');
  const abi = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/abi/AuctionPlatform.json'), 'utf8')).abi;
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS!, abi, provider);

  const count = await contract.auctionCount();
  console.log('Current on-chain auctionCount:', count.toString());
}

main().catch(console.error);
