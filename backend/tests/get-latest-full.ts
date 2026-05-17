import { prisma } from './src/config/database';

async function main() {
  const auction = await prisma.auctionMetadata.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  console.log(JSON.stringify(auction, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
