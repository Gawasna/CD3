import { Request, Response, NextFunction } from 'express';
import { generateNonce, verifySignature } from './auth.service';
import type { NonceQuery, VerifyBody } from './auth.schema';

/** GET /api/auth/nonce?wallet=0x... */
export async function getNonce(
  req: Request<unknown, unknown, unknown, NonceQuery>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await generateNonce(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/verify */
export async function postVerify(
  req: Request<unknown, unknown, VerifyBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await verifySignature(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
