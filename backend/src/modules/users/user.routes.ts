import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { updateProfileBodySchema } from './user.schema';
import { getMe, updateMe } from './user.controller';

const router = Router();

// Tất cả user routes đều yêu cầu JWT
router.use(authenticate);

// GET /api/users/me
router.get('/me', getMe);

// PUT /api/users/me
router.put('/me', validate(updateProfileBodySchema), updateMe);

export default router;
