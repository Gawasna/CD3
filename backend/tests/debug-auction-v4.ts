
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAuction() {
  const auctionId = '72d51b01-824b-4415-aac9-d3ce99f81415';
  const auction = await prisma.auctionMetadata.findUnique({
    where: { id: auctionId },
    include: {
      bids: { orderBy: { amountWei: 'desc' }, take: 5 }
    }
  });
  
  console.log('--- Auction Data (72d5...) ---');
  console.log(JSON.stringify(auction, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
}

checkAuction()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
