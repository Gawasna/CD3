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

/** Chỉ cho phép cập nhật displayName và avatarUrl (AUTH plan Step 6) */
export async function updateUserProfile(
  userId: string,
  data: { displayName?: string; avatarUrl?: string },
): Promise<UserProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
    },
    select: profileSelect,
  });

  return updated;
}
