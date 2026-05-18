
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAuction() {
  const auctionId = '446d55bc-4e40-4f6c-94a9-f8fd7184b89c';
  const auction = await prisma.auctionMetadata.findUnique({
    where: { id: auctionId }
  });
  
  console.log('--- Auction Data (446d...) ---');
  console.log(JSON.stringify(auction, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
  
  const onChainId = 3n;
  const auctionsWithId3 = await prisma.auctionMetadata.findMany({
    where: { onChainAuctionId: onChainId }
  });
  
  console.log(`\n--- Auctions with onChainAuctionId = ${onChainId} ---`);
  console.log(JSON.stringify(auctionsWithId3, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
}

checkAuction()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
