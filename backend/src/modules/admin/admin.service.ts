import { prisma } from '../../config/database';
import { Prisma, KycStatus } from '@prisma/client';
import { ApiError } from '../../shared/utils/api-error';
import fs from 'fs';
import path from 'path';

export class AdminService {
  /**
   * Helper: Xóa file KYC document để bảo vệ privacy
   */
  private deleteKycDocument(documentUrl: string | null) {
    if (!documentUrl) return;

    try {
      // documentUrl format: /uploads/kyc/kyc-userId-timestamp.ext
      // Chuyển thành absolute path
      const filename = path.basename(documentUrl);
      const filePath = path.join(process.cwd(), '../storage/kyc', filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[KYC Cleanup] Deleted document: ${filename}`);
      }
    } catch (error) {
      console.error('[KYC Cleanup] Failed to delete document:', error);
      // Không throw error để không làm gián đoạn flow chính
    }
  }

  /**
   * Helper: Xóa tất cả documents của KYC request
   */
  private deleteAllKycDocuments(frontIdUrl: string | null, backIdUrl: string | null, selfieUrl: string | null) {
    this.deleteKycDocument(frontIdUrl);
    this.deleteKycDocument(backIdUrl);
    this.deleteKycDocument(selfieUrl);
  }

  /**
   * Lấy danh sách các yêu cầu KYC (có thể filter theo status)
   */
  async getKycRequests(page: number, limit: number, status: string = 'PENDING') {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.kycRequest.findMany({
        where: { status: status as KycStatus },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { displayName: true, walletAddress: true }
          }
        }
      }),
      prisma.kycRequest.count({
        where: { status: status as KycStatus }
      })
    ]);

    return {
      data: requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Chấp nhận KYC
   */
  async approveKyc(kycId: string, adminId: string, ipAddress?: string) {
    const request = await prisma.kycRequest.findUnique({
      where: { id: kycId },
    });

    if (!request) {
      throw ApiError.notFound('KYC_NOT_FOUND', 'Không tìm thấy yêu cầu KYC');
    }

    if (request.status !== KycStatus.PENDING) {
      throw ApiError.badRequest('INVALID_STATUS', 'Chỉ có thể duyệt các yêu cầu ở trạng thái PENDING');
    }

    // Resolve walletAddress của Admin để lưu đúng theo schema (kycApprovedBy = walletAddress)
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { walletAddress: true },
    });

    // Thực hiện atomic transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Cập nhật KycRequest
      const updatedRequest = await tx.kycRequest.update({
        where: { id: kycId },
        data: {
          status: KycStatus.APPROVED,
          rejectionReason: null,
        },
      });

      // 2. Cập nhật User — kycApprovedBy lưu walletAddress theo schema design
      await tx.user.update({
        where: { id: request.userId },
        data: {
          kycStatus: KycStatus.APPROVED,
          kycApprovedAt: new Date(),
          kycApprovedBy: adminUser?.walletAddress ?? adminId,
        },
      });

      // 3. Ghi log Admin action
      await tx.adminActionLog.create({
        data: {
          adminId,
          action: 'APPROVE_KYC',
          targetId: kycId,
          targetType: 'KYC_REQUEST',
          ipAddress,
        },
      });

      return updatedRequest;
    });

    // 4. Xóa tất cả documents sau khi approve thành công (bảo vệ privacy)
    this.deleteAllKycDocuments(request.frontIdUrl, request.backIdUrl, request.selfieUrl);

    return result;
  }

  /**
   * Từ chối KYC
   */
  async rejectKyc(kycId: string, adminId: string, reason: string, ipAddress?: string) {
    const request = await prisma.kycRequest.findUnique({
      where: { id: kycId },
    });

    if (!request) {
      throw ApiError.notFound('KYC_NOT_FOUND', 'Không tìm thấy yêu cầu KYC');
    }

    if (request.status !== KycStatus.PENDING) {
      throw ApiError.badRequest('INVALID_STATUS', 'Chỉ có thể từ chối các yêu cầu ở trạng thái PENDING');
    }

    // Thực hiện atomic transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Cập nhật KycRequest
      const updatedRequest = await tx.kycRequest.update({
        where: { id: kycId },
        data: {
          status: KycStatus.REJECTED,
          rejectionReason: reason,
        },
      });

      // 2. Cập nhật User
      await tx.user.update({
        where: { id: request.userId },
        data: {
          kycStatus: KycStatus.REJECTED,
        },
      });

      // 3. Ghi log Admin action
      await tx.adminActionLog.create({
        data: {
          adminId,
          action: 'REJECT_KYC',
          targetId: kycId,
          targetType: 'KYC_REQUEST',
          metadata: { reason },
          ipAddress,
        },
      });

      return updatedRequest;
    });

    // 4. Xóa tất cả documents sau khi reject thành công (bảo vệ privacy)
    this.deleteAllKycDocuments(request.frontIdUrl, request.backIdUrl, request.selfieUrl);

    return result;
  }
}
