import { ethers } from 'ethers';
import { prisma } from './src/config/database';
import { env } from './src/config/env';
import AuctionPlatformABI from './src/abi/AuctionPlatform.json';

async function check() {
  console.log('--- BACKEND HEALTH CHECK ---');
  
  // 1. Check DB
  try {
    const userCount = await prisma.user.count();
    console.log(`[OK] Database connected. User count: ${userCount}`);
  } catch (e) {
    console.error('[FAIL] Database connection failed:', e);
  }

  // 2. Check Blockchain
  try {
    const provider = new ethers.JsonRpcProvider(env.RPC_URL);
    const block = await provider.getBlockNumber();
    console.log(`[OK] Blockchain connected. Current block: ${block}`);
    
    const contract = new ethers.Contract(env.CONTRACT_ADDRESS, AuctionPlatformABI.abi, provider);
    const admin = await contract.admin();
    console.log(`[OK] Contract found at ${env.CONTRACT_ADDRESS}. Admin: ${admin}`);
    
    const feeBalance = await contract.adminFeeBalance();
    console.log(`[OK] Admin Fee Balance: ${ethers.formatEther(feeBalance)} ETH`);
  } catch (e) {
    console.error('[FAIL] Blockchain/Contract connection failed:', e);
  }

  // 3. Check Pending Auctions
  const pending = await prisma.auctionMetadata.findMany({
    where: { status: 'PENDING' }
  });
  console.log(`[INFO] Pending auctions in DB: ${pending.length}`);
  for (const a of pending) {
    console.log(`  - ${a.title} (TX: ${a.createTxHash})`);
  }

  await prisma.$disconnect();
}

check();
