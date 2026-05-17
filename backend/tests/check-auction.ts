import { prisma } from './src/config/database';

async function main() {
  const auction = await prisma.auctionMetadata.findFirst({
    where: {
      title: {
        contains: 'Con meo biet ban sung',
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      title: true,
      status: true,
      startTime: true,
      onChainAuctionId: true
    }
  });

  if (!auction) {
    console.log('NOT_FOUND');
    return;
  }

  console.log(JSON.stringify(auction));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
