import { prisma } from './src/config/database';

async function main() {
  console.log('Cleaning up auctions and bids...');
  
  const bids = await prisma.bid.deleteMany({});
  console.log(`Deleted ${bids.count} bids.`);

  const auctions = await prisma.auctionMetadata.deleteMany({});
  console.log(`Deleted ${auctions.count} auctions.`);

  console.log('Database sync with new contract: READY.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
