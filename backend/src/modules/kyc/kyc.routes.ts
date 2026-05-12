import { Router } from 'express';
import { submitKyc, uploadKycDocument } from './kyc.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { uploadKycMiddleware } from '../../shared/middleware/upload';

const router = Router();

// Endpoint for users to submit KYC data
router.post('/', authenticate, submitKyc);

// Endpoint for uploading KYC document
router.post('/upload', authenticate, uploadKycMiddleware.single('document'), uploadKycDocument);

export default router;
