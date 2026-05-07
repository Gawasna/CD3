import { prisma } from '../../config/database';
import { ApiError } from '../../shared/utils/api-error';
import type { KycSubmitInput } from './kyc.schema';

export async function submitKyc(userId: string, input: KycSubmitInput) {
  // Check if user already has a pending or approved KYC
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true }
  });

  if (!user) {
    throw ApiError.notFound('USER_NOT_FOUND', 'User does not exist');
  }

  if (user.kycStatus === 'PENDING' || user.kycStatus === 'APPROVED') {
    throw ApiError.badRequest('KYC_EXISTS', 'A KYC request is already pending or approved');
  }

  // Create KycRequest and update User in a transaction
  const kycRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.kycRequest.upsert({
      where: { userId },
      update: {
        fullName: input.fullName,
        idNumber: input.idNumber,
        dateOfBirth: new Date(input.dateOfBirth),
        address: input.address,
        documentUrl: input.documentUrl,
        status: 'PENDING',
        rejectionReason: null,
      },
      create: {
        userId,
        fullName: input.fullName,
        idNumber: input.idNumber,
        dateOfBirth: new Date(input.dateOfBirth),
        address: input.address,
        documentUrl: input.documentUrl,
        status: 'PENDING',
      }
    });

    await tx.user.update({
      where: { id: userId },
      data: { kycStatus: 'PENDING' }
    });

    return request;
  });

  return kycRequest;
}
