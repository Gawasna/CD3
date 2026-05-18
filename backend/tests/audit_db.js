const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const auction = await prisma.auctionMetadata.findFirst({
      where: { id: { startsWith: '72d51b01' } },
      include: {
        bids: { orderBy: { amountWei: 'desc' }, take: 1 },
        shippingLogs: { orderBy: { createdAt: 'desc' } }
      }
    });
    console.log('--- DATABASE DATA ---');
    console.log(JSON.stringify(auction, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
