import { z } from 'zod';

// Regex validate: 0x + đúng 40 ký tự hex — case-insensitive, không dùng ethers.isAddress
// để tránh ethers version mismatch trong monorepo (root có thể resolve v5, backend dùng v6)
const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

/**
 * Reusable wallet address validator — normalize về lowercase để tránh case-sensitive bug (AUTH-NFR-02)
 */
const walletAddressSchema = z
  .string()
  .refine((val) => ETH_ADDRESS_RE.test(val), { message: 'Invalid Ethereum wallet address' })
  .transform((val) => val.toLowerCase());

/** GET /api/auth/nonce query params */
export const nonceQuerySchema = z.object({
  wallet: walletAddressSchema,
});

/** POST /api/auth/verify body */
export const verifyBodySchema = z.object({
  wallet: walletAddressSchema,
  message: z.string().min(1, 'message is required'),
  nonce: z.string().min(1, 'nonce is required'),
  signature: z
    .string()
    .min(1, 'signature is required')
    .refine((val) => /^0x[0-9a-fA-F]+$/.test(val), { message: 'signature must be a hex string' }),
});

export type NonceQuery = z.infer<typeof nonceQuerySchema>;
export type VerifyBody = z.infer<typeof verifyBodySchema>;
