const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const ABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/abi/AuctionPlatform.json'), 'utf8')).abi;
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  
  console.log('--- ON-CHAIN DATA ---');
  const count = await contract.auctionCount();
  console.log('Total auctions:', count.toString());
  
  const i = 4;
  const a = await contract.auctions(i);
  const bidEth = ethers.formatEther(a.highestBid);
  console.log('On-chain ID:', i);
  console.log('Seller:', a.seller);
  console.log('Highest Bid:', bidEth, 'ETH');
  console.log('Winner:', a.highestBidder);
  console.log('Status Index:', a.status.toString(), '(3 = Ended)');
  console.log('Escrow Status Index:', a.escrowStatus.toString(), '(2 = AwaitingDelivery, 4 = Completed)');
  console.log('Shipping Fee:', ethers.formatEther(a.shippingFee), 'ETH');
  console.log('Shipping Payer:', a.shippingPayer.toString(), '(0 = Buyer, 1 = Seller)');
  console.log('Fee Paid:', a.shippingFeePaid);
  console.log('Shipped Time:', new Date(Number(a.shippedTime) * 1000).toLocaleString());
}
main().catch(console.error);
