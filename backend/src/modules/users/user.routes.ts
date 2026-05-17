import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { updateProfileBodySchema } from './user.schema';
import { getMe, updateMe, uploadAvatar, getFollowing, getFollowers, checkFollowing, follow, unfollow } from './user.controller';
import { uploadAvatarMiddleware } from '../../shared/middleware/upload';

const router = Router();

// Tất cả user routes đều yêu cầu JWT
router.use(authenticate);

// GET /api/users/me
router.get('/me', getMe);

// PUT /api/users/me
router.put('/me', validate(updateProfileBodySchema), updateMe);

// POST /api/users/me/avatar
router.post('/me/avatar', uploadAvatarMiddleware.single('avatar'), uploadAvatar);

// Follow logic
router.get('/me/following', getFollowing);
router.get('/me/followers', getFollowers);
router.get('/:id/is-following', checkFollowing);
router.post('/:id/follow', follow);
router.delete('/:id/follow', unfollow);

export default router;
