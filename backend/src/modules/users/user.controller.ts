import { Request, Response, NextFunction } from 'express';
import { getUserById, updateUserProfile } from './user.service';
import type { UpdateProfileBody } from './user.schema';
import { ApiError } from '../../shared/utils/api-error';

/** GET /api/users/me */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req.user được gán bởi authenticate middleware
    const user = await getUserById(req.user!.id);
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
    const user = await updateUserProfile(req.user!.id, req.body);
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

    // HTTP path tới ảnh
    // req.file.filename sẽ có dạng `uuid-timestamp.png`
    const avatarUrl = `${process.env.API_URL || 'http://localhost:3001'}/uploads/avatars/${req.file.filename}`;

    // Lưu vào db
    const user = await updateUserProfile(req.user!.id, { avatarUrl });

    res.status(200).json({
      message: 'Upload avatar thành công',
      user
    });
  } catch (err) {
    next(err);
  }
}
