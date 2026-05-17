import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- RESETTING AUCTIONS DUE TO CONTRACT REDEPLOY ---');
  
  // Xóa các bảng liên quan theo thứ tự ràng buộc
  await prisma.shippingLog.deleteMany({});
  await prisma.disputeLog.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.watchlist.deleteMany({});
  await prisma.auctionMetadata.deleteMany({});
  
  console.log('All auctions, bids, and related logs have been cleared.');
  console.log('Please restart your backend listener and frontend to start fresh.');

  await prisma.$disconnect();
}

main().catch(console.error);
