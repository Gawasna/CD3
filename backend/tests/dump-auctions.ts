import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  console.log('--- DUMP ALL AUCTIONS ---');
  try {
    const auctions = await prisma.auctionMetadata.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { bids: true } }
      }
    });

    console.log('Total auctions:', auctions.length);
    auctions.forEach(a => {
      console.log(`- Title: ${a.title}`);
      console.log(`  Status: ${a.status}`);
      console.log(`  StartTime: ${a.startTime}`);
      console.log(`  EndTime: ${a.endTime}`);
      console.log(`  OnChainId: ${a.onChainAuctionId}`);
      console.log(`  Bids: ${a._count.bids}`);
      console.log(`  Created: ${a.createdAt}`);
      console.log('-------------------------');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
