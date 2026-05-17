import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
  const mixedId = '0b51fcea-0b66-4ab2-9a73-29ccc29ed324';
  
  // Kiểm tra xem có tồn tại không trước khi xóa
  const user = await prisma.user.findUnique({ where: { id: mixedId } });
  if (user) {
    await prisma.adminActionLog.deleteMany({ where: { adminId: mixedId } });
    await prisma.user.delete({ where: { id: mixedId } });
    console.log('Deleted mixed-case duplicate user:', mixedId);
  } else {
    console.log('Mixed-case duplicate not found, skipping.');
  }

  // Đảm bảo user lowercase đã có role ADMIN
  const lowerUser = await prisma.user.findUnique({
    where: { walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' }
  });
  console.log('Final Admin Check:', JSON.stringify(lowerUser, null, 2));

  await prisma.$disconnect();
}

clean();
