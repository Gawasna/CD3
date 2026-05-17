import { prisma } from '../../config/database';

export class ActivityService {
  /**
   * Logs a user activity into the database.
   * This should be called synchronously within the business service
   * to ensure audit trail integrity.
   */
  async logActivity(
    userId: string,
    action: string,
    targetId?: string,
    targetType?: string,
    metadata?: any,
    ipAddress?: string
  ) {
    try {
      return await prisma.userActivity.create({
        data: {
          userId,
          action,
          targetId,
          targetType,
          metadata: metadata || {},
          ipAddress,
        },
      });
    } catch (error) {
      // We don't want to break the main flow if activity logging fails,
      // but we should log it for debugging.
      console.error('Failed to log user activity:', error);
    }
  }

  /**
   * Retrieves activity history for a specific user.
   */
  async getUserActivities(userId: string, limit = 20, offset = 0) {
    return prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}

export const activityService = new ActivityService();
