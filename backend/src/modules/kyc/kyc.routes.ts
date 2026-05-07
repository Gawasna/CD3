import { Router } from 'express';
import { submitKyc } from './kyc.controller';
import { authenticate } from '../../shared/middleware/authenticate';

const router = Router();

// Endpoint for users to submit KYC data
router.post('/', authenticate, submitKyc);

export default router;
