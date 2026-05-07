import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { ApiError } from '../../shared/utils/api-error';

const adminService = new AdminService();

export const getKycRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as string) || 'PENDING';

    const result = await adminService.getKycRequests(page, limit, status);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const approveKyc = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const adminId = req.user?.id;

    if (!adminId) {
      throw ApiError.unauthorized('UNAUTHORIZED', 'Admin không hợp lệ');
    }

    const result = await adminService.approveKyc(id, adminId, (Array.isArray(req.ip) ? req.ip[0] : req.ip) as string | undefined);
    res.status(200).json({
      success: true,
      message: 'Đã duyệt yêu cầu KYC thành công',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectKyc = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      throw ApiError.unauthorized('UNAUTHORIZED', 'Admin không hợp lệ');
    }

    if (!reason || reason.trim() === '') {
      throw ApiError.badRequest('REASON_REQUIRED', 'Phải nhập lý do từ chối');
    }

    const result = await adminService.rejectKyc(id, adminId, reason, (Array.isArray(req.ip) ? req.ip[0] : req.ip) as string | undefined);
    res.status(200).json({
      success: true,
      message: 'Đã từ chối yêu cầu KYC',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
