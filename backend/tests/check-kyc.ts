import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkKycRequests() {
  console.log('--- KIỂM TRA BẢNG KYC_REQUESTS ---');
  
  const requests = await prisma.kycRequest.findMany({
    include: {
      user: {
        select: { walletAddress: true, kycStatus: true }
      }
    }
  });

  if (requests.length === 0) {
    console.log('Không tìm thấy bản ghi nào trong bảng kyc_requests.');
  } else {
    requests.forEach(req => {
      console.log(`User Wallet: ${req.user.walletAddress}`);
      console.log(`  - Request ID: ${req.id}`);
      console.log(`  - Request Status: ${req.status}`);
      console.log(`  - User kycStatus: ${req.user.kycStatus}`);
      console.log('-----------------------------------');
    });
  }

  await prisma.$disconnect();
}

checkKycRequests();
