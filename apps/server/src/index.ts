import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

// Import configuration
import { env, corsConfig, rateLimitConfig, isProduction } from './config/env';
import { connectDatabase, disconnectDatabase, isDatabaseHealthy } from './config/database';

// Import services
import cronJobService from './services/CronJobService';

// Import routes
import apiRoutes from './routes';

const app = express();
const PORT = env.PORT;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit(rateLimitConfig);
app.use(limiter);

// CORS configuration
app.use(cors(corsConfig));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check route
app.get('/health', async (req: Request, res: Response) => {
  const dbHealthy = await isDatabaseHealthy();
  
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'OK' : 'ERROR',
    message: 'Plant Care API is running',
    timestamp: new Date().toISOString(),
    service: 'plant-care-api',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected',
    environment: env.NODE_ENV,
  });
});

// API routes
app.use('/api', apiRoutes);

// Legacy status endpoint
app.get('/api/v1/status', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Plant Care API is ready',
    environment: env.NODE_ENV,
    port: env.PORT,
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: isProduction() 
      ? 'Something went wrong' 
      : error.message,
    timestamp: new Date().toISOString(),
    ...(error.stack && !isProduction() && { stack: error.stack }),
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop cron jobs
    cronJobService.stopAllJobs();
    console.log('✅ Cron jobs stopped');
    
    await disconnectDatabase();
    console.log('✅ Database disconnected successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    // Validate environment configuration
    console.log('🔧 Validating environment configuration...');
    console.log(`📍 Environment: ${env.NODE_ENV}`);
    console.log(`🚪 Port: ${env.PORT}`);
    
    // Initialize database connection
    console.log('🔗 Connecting to database...');
    await connectDatabase();
    
    // Initialize cron jobs
    console.log('⏰ Initializing cron jobs...');
    cronJobService.initializeJobs();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Plant Care API running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`💾 Database: Connected`);
      console.log(`⏰ Cron jobs: Active`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Export for testing
export { app };

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});