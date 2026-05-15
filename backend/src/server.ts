import 'dotenv/config';
import app from './app';
import pino from 'pino';
import { startAuctionCreatedListener, stopAuctionCreatedListener } from './listeners/auction-created.listener';
import { startCleanupJob } from './listeners/cleanup-pending-auctions';
import { startAuctionStatusJob } from './listeners/auction-status.job';

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

let stopCleanup: (() => void) | undefined;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
  
  // Start blockchain event listener
  try {
    startAuctionCreatedListener();
    logger.info('Blockchain event listener started');
  } catch (error) {
    logger.error(error, 'Failed to start blockchain event listener');
  }

  // Start cleanup job
  try {
    stopCleanup = startCleanupJob();
  } catch (error) {
    logger.error(error, 'Failed to start cleanup job');
  }

  // Start auction status update job
  try {
    startAuctionStatusJob();
  } catch (error) {
    logger.error(error, 'Failed to start auction status update job');
  }
});

// Handle generic unhandled rejections
process.on('unhandledRejection', (err: any) => {
  logger.error(err, 'Unhandled Rejection. Shutting down...');
  stopAuctionCreatedListener();
  stopCleanup?.();
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  stopAuctionCreatedListener();
  stopCleanup?.();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  stopAuctionCreatedListener();
  stopCleanup?.();
  server.close(() => {
    process.exit(0);
  });
});
