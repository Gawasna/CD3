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

// Shared middleware
import { errorHandler } from './shared/middleware/error-handler';

const app = express();

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

// Global error handler — PHẢI đặt cuối cùng
app.use(errorHandler);

export default app;
