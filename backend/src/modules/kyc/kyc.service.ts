import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../shared/utils/api-error';
import type { KycSubmitInput } from './kyc.schema';

export async function submitKyc(userId: string, input: KycSubmitInput) {
  // Check if user already has a pending or approved KYC
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      kycStatus: true,
      kycRequest: true // Check if request record actually exists
    }
  });

  if (!user) {
    throw ApiError.notFound('USER_NOT_FOUND', 'User does not exist');
  }

  // If status is APPROVED, always block
  if (user.kycStatus === 'APPROVED') {
    throw ApiError.badRequest('KYC_EXISTS', 'Your KYC has already been approved');
  }

  // If status is PENDING, only block if the KycRequest record actually exists
  if (user.kycStatus === 'PENDING' && user.kycRequest) {
    throw ApiError.badRequest('KYC_EXISTS', 'A KYC request is already pending');
  }

  // Create KycRequest and update User in a transaction
  const kycRequest = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const request = await tx.kycRequest.upsert({
      where: { userId },
      update: {
        fullName: input.fullName,
        idNumber: input.idNumber,
        dateOfBirth: new Date(input.dateOfBirth),
        address: input.address,
        frontIdUrl: input.frontIdUrl,
        backIdUrl: input.backIdUrl,
        selfieUrl: input.selfieUrl,
        status: 'PENDING',
        rejectionReason: null,
      },
      create: {
        userId,
        fullName: input.fullName,
        idNumber: input.idNumber,
        dateOfBirth: new Date(input.dateOfBirth),
        address: input.address,
        frontIdUrl: input.frontIdUrl,
        backIdUrl: input.backIdUrl,
        selfieUrl: input.selfieUrl,
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
