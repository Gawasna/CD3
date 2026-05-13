import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  SIWE_NONCE_TTL_MINUTES: z.coerce.number().default(10),
  SIWE_DOMAIN: z.string().default('localhost:3000'),
  SIWE_URI: z.string().default('http://localhost:3000'),
  // 1337 = Ganache Desktop/CLI runtime — KHÔNG phải 31337 (Hardhat in-process test network)
  SIWE_CHAIN_ID: z.coerce.number().default(1337),
  // Blockchain listener config
  RPC_URL: z.string().url('RPC_URL must be a valid URL').default('http://127.0.0.1:8545'),
  CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'CONTRACT_ADDRESS must be a valid Ethereum address'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
