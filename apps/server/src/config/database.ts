import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

// Prisma Client singleton pattern
declare global {
  var __prisma: PrismaClient | undefined;
}

// Prisma Client configuration
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] as const
    : ['error'] as const,
  errorFormat: 'pretty' as const,
};

// Create Prisma Client instance
const prisma = globalThis.__prisma || new PrismaClient(prismaClientOptions);

// In development, save the instance to global to prevent hot-reload issues
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

/**
 * Connect to the database
 * @returns Promise<void>
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection test passed');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw new Error('Failed to connect to database');
  }
};

/**
 * Disconnect from the database
 * @returns Promise<void>
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw new Error('Failed to disconnect from database');
  }
};

/**
 * Health check for the database
 * @returns Promise<boolean>
 */
export const isDatabaseHealthy = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
};

/**
 * Get database connection info
 * @returns Object with connection details
 */
export const getDatabaseInfo = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1),
      username: url.username,
      ssl: url.searchParams.get('sslmode') !== 'disable',
    };
  } catch (error) {
    throw new Error('Invalid DATABASE_URL format');
  }
};

// Export the Prisma Client instance
export { prisma };
export default prisma;