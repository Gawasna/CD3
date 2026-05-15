import { PrismaClient } from '@prisma/client';
import pino from 'pino';

const logger = pino({
  level: 'debug',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname',
      messageFormat: '{msg} [{duration}]',
    },
  } : undefined,
});

// Singleton pattern — tránh tạo nhiều connection pool trong development (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: any };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ] 
      : ['error'],
  });

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as any, (e: any) => {
    // Truncate query if it's too long (e.g., batch inserts)
    const MAX_QUERY_LEN = 300;
    const query = e.query.length > MAX_QUERY_LEN 
      ? e.query.substring(0, MAX_QUERY_LEN) + '... (truncated)' 
      : e.query;
    
    logger.debug({
      duration: `${e.duration}ms`,
      // params: e.params, // Uncomment if you need to see params
    }, `🔍 ${query}`);
  });

  prisma.$on('error' as any, (e: any) => {
    logger.error(e.message);
  });

  prisma.$on('warn' as any, (e: any) => {
    logger.warn(e.message);
  });
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
