import { prisma } from '../../config/database';
import { ApiError } from '../../shared/utils/api-error';

/** Shape trả về cho profile — không expose field nhạy cảm */
export type UserProfile = {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  kycStatus: string;
  isActive: boolean;
  address1: string | null;
  address2: string | null;
  lastAddressUpdate: Date | null;
  createdAt: Date;
};

const profileSelect = {
  id: true,
  walletAddress: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  kycStatus: true,
  isActive: true,
  address1: true,
  address2: true,
  lastAddressUpdate: true,
  createdAt: true,
} as const;

export async function getUserById(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });

  if (!user) {
    throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
  }

  return user;
}

/** Chỉ cho phép cập nhật displayName, avatarUrl, address1, address2 (AUTH plan Step 6) */
export async function updateUserProfile(
  userId: string,
  data: { displayName?: string; avatarUrl?: string; address1?: string; address2?: string },
): Promise<UserProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
  }

  const isUpdatingAddress = data.address1 !== undefined || data.address2 !== undefined;

  if (isUpdatingAddress) {
    const lastUpdate = user.lastAddressUpdate;
    if (lastUpdate) {
      const now = new Date();
      const diffInMs = now.getTime() - lastUpdate.getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      if (diffInMs < oneDayInMs) {
        throw ApiError.badRequest(
          'ADDRESS_UPDATE_LIMIT',
          'Bạn chỉ có thể cập nhật địa chỉ tối đa 1 lần mỗi ngày',
        );
      }
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      ...(data.address1 !== undefined ? { address1: data.address1 } : {}),
      ...(data.address2 !== undefined ? { address2: data.address2 } : {}),
      ...(isUpdatingAddress ? { lastAddressUpdate: new Date() } : {}),
    },
    select: profileSelect,
  });

  return updated;
}
