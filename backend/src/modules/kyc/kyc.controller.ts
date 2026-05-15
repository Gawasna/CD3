import { Request, Response, NextFunction } from 'express';
import { kycSubmitSchema } from './kyc.schema';
import * as kycService from './kyc.service';
import { ApiError } from '../../shared/utils/api-error';

export async function submitKyc(req: Request, res: Response, next: NextFunction) {
  try {
    // Parse data từ FormData hoặc JSON
    const data = req.body;
    
    // Validate với schema
    const payload = kycSubmitSchema.parse(data);
    const userId = req.user!.id; // req.user.id is populated by authenticate middleware

    const kycRequest = await kycService.submitKyc(userId, payload);

    res.status(201).json({
      success: true,
      data: kycRequest,
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as unknown as { errors: { message: string }[] };
      next(ApiError.badRequest('VALIDATION_ERROR', zodError.errors[0].message));
      return;
    }
    next(error);
  }
}

export async function uploadKycDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw ApiError.badRequest('NO_FILE', 'Vui lòng upload tài liệu KYC');
    }

    // Trả về URL để frontend có thể sử dụng khi submit KYC
    const documentUrl = `/uploads/kyc/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        documentUrl,
        filename: req.file.filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
}
