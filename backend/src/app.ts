import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

// Config — phải import env trước để validate fail fast
import { env } from './config/env';

// Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import kycRoutes from './modules/kyc/kyc.routes';
import adminRoutes from './modules/admin/admin.routes';
import auctionRoutes from './modules/auction/auction.routes';

// Shared middleware
import { errorHandler } from './shared/middleware/error-handler';

import path from 'path';

const app = express();

// Phân phối static file cho chức năng upload (Lấy từ storage folder ngoài project root)
app.use('/uploads/avatars', express.static(path.join(process.cwd(), '../storage/avatars')));

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.NODE_ENV === 'production' ? env.SIWE_URI : '*',
    credentials: true,
  }),
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP logger — skip healthcheck để không spam log
app.use(
  pinoHttp({
    autoLogging: {
      ignore: (req) => req.url === '/healthcheck',
    },
  }),
);

// Health check — không auth
app.get('/healthcheck', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/auctions', auctionRoutes);

// Global error handler — PHẢI đặt cuối cùng
app.use(errorHandler);

export default app;
