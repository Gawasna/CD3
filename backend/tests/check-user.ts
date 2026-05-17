import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' }
  });
  console.log('User in DB:', JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

check();
