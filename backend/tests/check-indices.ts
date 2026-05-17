import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const wallets = [
    '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    '0x90f79bf6eb2c4f870365e785982e1f101e93b906'
  ];

  for (const w of wallets) {
    const u = await prisma.user.findUnique({
      where: { walletAddress: w }
    });
    if (u) {
      console.log(`Wallet: ${w} | Role: ${u.role} | KYC: ${u.kycStatus}`);
    } else {
      console.log(`Wallet: ${w} | NOT FOUND`);
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
