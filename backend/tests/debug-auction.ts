
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAuction() {
  const auctionId = '446d55bc-4e40-4f6c-94a9-f8fd7184b89c';
  const auction = await prisma.auctionMetadata.findUnique({
    where: { id: auctionId }
  });
  
  console.log('--- Auction Data ---');
  console.log(JSON.stringify(auction, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
  
  if (auction && auction.createTxHash) {
    console.log('\n--- Checking for other auctions with same TxHash ---');
    const duplicates = await prisma.auctionMetadata.findMany({
      where: { createTxHash: auction.createTxHash }
    });
    console.log(`Found ${duplicates.length} auctions with this TxHash`);
  }
}

checkAuction()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
