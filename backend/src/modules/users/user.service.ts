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

export async function checkFollowingStatus(followerId: string, followingId: string): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });
  return !!follow;
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw ApiError.badRequest('CANNOT_FOLLOW_SELF', 'Bạn không thể theo dõi chính mình');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
  if (!targetUser) {
    throw ApiError.notFound('USER_NOT_FOUND', 'Người dùng không tồn tại');
  }

  try {
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Ghi activity
    await prisma.userActivity.create({
      data: {
        userId: followerId,
        action: 'FOLLOW_USER',
        targetId: followingId,
        targetType: 'USER',
      },
    });

    return follow;
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw ApiError.badRequest('ALREADY_FOLLOWING', 'Bạn đã theo dõi người dùng này rồi');
    }
    throw err;
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  try {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    // Ghi activity
    await prisma.userActivity.create({
      data: {
        userId: followerId,
        action: 'UNFOLLOW_USER',
        targetId: followingId,
        targetType: 'USER',
      },
    });
  } catch (err: any) {
    if (err.code === 'P2025') {
      throw ApiError.notFound('FOLLOW_NOT_FOUND', 'Bạn chưa theo dõi người dùng này');
    }
    throw err;
  }
}

export async function getFollowing(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: profileSelect,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return follows.map((f) => f.following);
}

export async function getFollowers(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: profileSelect,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return follows.map((f) => f.follower);
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
