import { describe, expect, it } from 'vitest';
import { nonceQuerySchema, verifyBodySchema } from '../../src/modules/auth/auth.schema';

const MIXED_CASE_WALLET = '0xF39fD6e51AaD88F6F4Ce6aB8827279cffFb92266';
const LOWERCASE_WALLET = MIXED_CASE_WALLET.toLowerCase();

describe('auth.schema - nonceQuerySchema', () => {
  it('accepts a valid wallet and normalizes it to lowercase', () => {
    const result = nonceQuerySchema.parse({ wallet: MIXED_CASE_WALLET });

    expect(result.wallet).toBe(LOWERCASE_WALLET);
  });

  it('rejects an invalid wallet address', () => {
    const result = nonceQuerySchema.safeParse({ wallet: '0xnot-a-wallet' });

    expect(result.success).toBe(false);
  });
});

describe('auth.schema - verifyBodySchema', () => {
  it('accepts a valid verify payload and normalizes the wallet', () => {
    const result = verifyBodySchema.parse({
      wallet: MIXED_CASE_WALLET,
      message: 'localhost wants you to sign in',
      nonce: 'nonce-123',
      signature: '0xdeadbeef',
    });

    expect(result.wallet).toBe(LOWERCASE_WALLET);
  });

  it('rejects a missing SIWE message', () => {
    const result = verifyBodySchema.safeParse({
      wallet: MIXED_CASE_WALLET,
      message: '',
      nonce: 'nonce-123',
      signature: '0xdeadbeef',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a non-hex signature', () => {
    const result = verifyBodySchema.safeParse({
      wallet: MIXED_CASE_WALLET,
      message: 'localhost wants you to sign in',
      nonce: 'nonce-123',
      signature: 'not-a-hex-signature',
    });

    expect(result.success).toBe(false);
  });
});
