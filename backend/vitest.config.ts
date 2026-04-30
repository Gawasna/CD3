import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    // Load .env.test nếu có, fallback sang .env
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/cd3_test',
      JWT_SECRET: 'test-secret-for-unit-tests-only',
      JWT_EXPIRES_IN: '1h',
      SIWE_NONCE_TTL_MINUTES: '10',
      SIWE_DOMAIN: 'localhost:3000',
      SIWE_URI: 'http://localhost:3000',
      SIWE_CHAIN_ID: '31337',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
