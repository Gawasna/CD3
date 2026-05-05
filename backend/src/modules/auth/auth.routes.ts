import { Router } from 'express';
import { validate } from '../../shared/middleware/validate';
import { nonceQuerySchema, verifyBodySchema } from './auth.schema';
import { getNonce, postVerify } from './auth.controller';

const router = Router();

// GET /api/auth/nonce?wallet=0x...
router.get('/nonce', validate(nonceQuerySchema, 'query'), getNonce);

// POST /api/auth/verify
router.post('/verify', validate(verifyBodySchema, 'body'), postVerify);

export default router;
