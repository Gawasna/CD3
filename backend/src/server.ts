import 'dotenv/config';
import app from './app';
import pino from 'pino';

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  } : undefined,
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
});

// Handle generic unhandled rejections
process.on('unhandledRejection', (err: any) => {
  logger.error(err, 'Unhandled Rejection. Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
