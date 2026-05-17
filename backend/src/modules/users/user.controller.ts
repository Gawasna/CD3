import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';
import type { UpdateProfileBody } from './user.schema';
import { ApiError } from '../../shared/utils/api-error';

/** GET /api/users/me */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req.user được gán bởi authenticate middleware
    const user = await userService.getUserById(req.user!.id);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/users/me */
export async function updateMe(
  req: Request<unknown, unknown, UpdateProfileBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.updateUserProfile(req.user!.id, req.body);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

/** POST /api/users/me/avatar */
export async function uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw ApiError.badRequest('NO_FILE_UPLOADED', 'Bạn chưa tải file ảnh lên');
    }

    const avatarUrl = `${process.env.API_URL || 'http://localhost:3001'}/uploads/avatars/${req.file.filename}`;
    const user = await userService.updateUserProfile(req.user!.id, { avatarUrl });

    res.status(200).json({
      message: 'Upload avatar thành công',
      user
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/users/:id/follow */
export async function follow(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const followingId = req.params.id as string;
    const followerId = req.user!.id;
    await userService.followUser(followerId, followingId);
    res.status(200).json({ message: 'Follow thành công' });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/users/:id/follow */
export async function unfollow(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const followingId = req.params.id as string;
    const followerId = req.user!.id;
    await userService.unfollowUser(followerId, followingId);
    res.status(200).json({ message: 'Unfollow thành công' });
  } catch (err) {
    next(err);
  }
}

/** GET /api/users/me/following */
export async function getFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await userService.getFollowing(req.user!.id);
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
}

/** GET /api/users/me/followers */
export async function getFollowers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await userService.getFollowers(req.user!.id);
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
}

/** GET /api/users/:id/is-following */
export async function checkFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const followingId = req.params.id as string;
    const followerId = req.user!.id;
    const isFollowing = await userService.checkFollowingStatus(followerId, followingId);
    res.status(200).json({ isFollowing });
  } catch (err) {
    next(err);
  }
}
