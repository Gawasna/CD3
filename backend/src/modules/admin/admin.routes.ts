import { Router } from 'express';
import { getKycRequests, approveKyc, rejectKyc } from './admin.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';

const router = Router();

// Tất cả các route Admin đều yêu cầu đăng nhập và có role là ADMIN
router.use(authenticate, requireRole('ADMIN'));

// Lấy danh sách KYC Requests
router.get('/kyc', getKycRequests);

// Duyệt KYC
router.post('/kyc/:id/approve', approveKyc);

// Từ chối KYC
router.post('/kyc/:id/reject', rejectKyc);

export default router;
