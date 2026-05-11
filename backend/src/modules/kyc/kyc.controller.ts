import { Request, Response, NextFunction } from 'express';
import { kycSubmitSchema } from './kyc.schema';
import * as kycService from './kyc.service';
import { ApiError } from '../../shared/utils/api-error';

export async function submitKyc(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = kycSubmitSchema.parse(req.body);
    const userId = req.user!.id; // req.user.id is populated by authenticate middleware

    const kycRequest = await kycService.submitKyc(userId, payload);

    res.status(201).json({
      success: true,
      data: kycRequest,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      next(ApiError.badRequest('VALIDATION_ERROR', error.errors[0].message));
      return;
    }
    next(error);
  }
}
