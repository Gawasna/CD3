import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const RPC_URL = 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const ABI = require('../src/abi/AuctionPlatform.json').abi;

async function runTest() {
  console.log('🚀 Starting Core Auction Coverage Test...');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // Use Hardhat default accounts
  const seller = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider); // Account #0
  const bidder1 = new ethers.Wallet('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', provider); // Account #1
  const bidder2 = new ethers.Wallet('0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', provider); // Account #2
  const admin = seller; // In local hardhat, deployer (Account #0) is usually admin

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, seller);

  console.log(`- Seller: ${seller.address}`);
  console.log(`- Bidder 1: ${bidder1.address}`);
  console.log(`- Bidder 2: ${bidder2.address}`);

  // 1. Create Auction
  console.log('\n1. Creating Auction...');
  const startingPrice = ethers.parseEther('0.1');
  const duration = 300; // 5 minutes
  const collateral = ethers.parseEther('0.01'); // 10%
  
  const createTx = await contract.createAuction(
    startingPrice,
    Math.floor(Date.now() / 1000),
    duration,
    'ipfs://mock-cid-123',
    0, // No buy now
    0, // ShippingPayer.Buyer
    { value: collateral }
  );
  const createReceipt = await createTx.wait();
  // Find AuctionCreated event to get ID
  const auctionCreatedEvent = createReceipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === 'AuctionCreated';
    } catch { return false; }
  });
  const auctionId = contract.interface.parseLog(auctionCreatedEvent).args[0];
  console.log(`✅ Auction created with ID: ${auctionId}`);

  // 2. Place Bids
  console.log('\n2. Placing Bids...');
  const bid1Amount = ethers.parseEther('0.11');
  const bid2Amount = ethers.parseEther('0.15');

  console.log(`- Bidder 1 bids ${ethers.formatEther(bid1Amount)} ETH`);
  const bid1Tx = await contract.connect(bidder1).bid(auctionId, { value: bid1Amount });
  await bid1Tx.wait();

  console.log(`- Bidder 2 bids ${ethers.formatEther(bid2Amount)} ETH (outbidding 1)`);
  const bid2Tx = await contract.connect(bidder2).bid(auctionId, { value: bid2Amount });
  await bid2Tx.wait();

  // 3. Loser Withdrawal (Bidder 1)
  console.log('\n3. Testing Loser Withdrawal...');
  const balanceBefore = await provider.getBalance(bidder1.address);
  const withdrawTx = await contract.connect(bidder1).withdraw();
  await withdrawTx.wait();
  const balanceAfter = await provider.getBalance(bidder1.address);
  
  if (balanceAfter > balanceBefore) {
    console.log(`✅ Bidder 1 successfully withdrew funds. Difference: ${ethers.formatEther(balanceAfter - balanceBefore)} ETH`);
  } else {
    console.error('❌ Bidder 1 withdrawal failed or balance did not increase.');
  }

  // 4. End Auction
  console.log('\n4. Ending Auction...');
  console.log('- Increasing blockchain time by 10 minutes...');
  await provider.send('evm_increaseTime', [600]);
  await provider.send('evm_mine', []);

  const endTx = await contract.endAuction(auctionId);
  await endTx.wait();
  console.log('✅ Auction ended on-chain.');

  // 5. Shipping Fee Setup
  console.log('\n5. Setting Shipping Fee...');
  const shippingFee = ethers.parseEther('0.005');
  const setFeeTx = await contract.connect(admin).setShippingFee(auctionId, shippingFee);
  await setFeeTx.wait();
  console.log(`✅ Shipping fee set to ${ethers.formatEther(shippingFee)} ETH`);

  // 6. Pay Shipping Fee (Winner - Bidder 2)
  console.log('\n6. Paying Shipping Fee...');
  const payFeeTx = await contract.connect(bidder2).payShippingFee(auctionId, { value: shippingFee });
  await payFeeTx.wait();
  console.log('✅ Shipping fee paid by winner.');

  // 7. Mark Shipped (Seller)
  console.log('\n7. Marking Shipped...');
  const proofHash = ethers.id('mock-tracking-number-123');
  const shipTx = await contract.connect(seller).markShipped(auctionId, proofHash);
  await shipTx.wait();
  console.log('✅ Item marked as shipped.');

  // 8. Confirm Delivery (Winner)
  console.log('\n8. Confirming Delivery...');
  const confirmTx = await contract.connect(bidder2).confirmDelivery(auctionId);
  await confirmTx.wait();
  console.log('✅ Delivery confirmed.');

  // 9. Verify Payouts
  console.log('\n9. Verifying Final State...');
  const auctionInfo = await contract.auctions(auctionId);
  console.log(`- Escrow Status: ${auctionInfo.escrowStatus}`); // Should be Completed (4)
  
  if (auctionInfo.escrowStatus.toString() === '4') {
    console.log('✅ TEST PASSED: Full lifecycle completed successfully.');
  } else {
    console.error(`❌ TEST FAILED: Unexpected Escrow Status: ${auctionInfo.escrowStatus}`);
  }
}

runTest().catch(console.error);
