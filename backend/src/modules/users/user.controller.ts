import { Request, Response, NextFunction } from 'express';
import { getUserById, updateUserProfile } from './user.service';
import type { UpdateProfileBody } from './user.schema';

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
