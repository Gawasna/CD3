import { prisma } from './src/config/database';

async function main() {
  const auctions = await prisma.auctionMetadata.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      onChainAuctionId: true
    }
  });

  console.log(JSON.stringify(auctions, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
