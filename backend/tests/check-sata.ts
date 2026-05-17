import { prisma } from './src/config/database';

async function main() {
  const auction = await prisma.auctionMetadata.findFirst({
    where: {
      title: {
        contains: 'Ổ cứng SATA',
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      title: true,
      status: true,
      createTxHash: true,
      onChainAuctionId: true,
      startTime: true
    }
  });

  if (!auction) {
    console.log('NOT_FOUND');
    return;
  }

  console.log(JSON.stringify(auction, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
