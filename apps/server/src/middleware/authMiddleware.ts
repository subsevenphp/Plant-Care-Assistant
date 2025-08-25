import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string;
      };
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;
  private userRepository: UserRepository;

  constructor() {
    this.authService = new AuthService();
    this.userRepository = new UserRepository();
  }

  /**
   * Main authentication middleware
   * Verifies JWT token and adds user to request object
   */
  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract token from Authorization header
      const token = this.authService.extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access token is required',
          error: 'MISSING_TOKEN',
        });
      }

      // Verify token
      let decoded;
      try {
        decoded = await this.authService.verifyToken(token);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
        
        // Determine specific error type
        let errorCode = 'INVALID_TOKEN';
        if (errorMessage.includes('expired')) {
          errorCode = 'TOKEN_EXPIRED';
        } else if (errorMessage.includes('not active')) {
          errorCode = 'TOKEN_NOT_ACTIVE';
        }

        return res.status(401).json({
          success: false,
          message: errorMessage,
          error: errorCode,
        });
      }

      // Verify user still exists in database
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists',
          error: 'USER_NOT_FOUND',
        });
      }

      // Add user to request object
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      };

      next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication service error',
        error: 'AUTH_SERVICE_ERROR',
      });
    }
  };

  /**
   * Optional authentication middleware
   * Adds user to request if token is present, but doesn't fail if missing
   */
  optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = this.authService.extractTokenFromHeader(req.headers.authorization);

      if (token) {
        try {
          const decoded = await this.authService.verifyToken(token);
          const user = await this.userRepository.findById(decoded.userId);
          
          if (user) {
            req.user = {
              id: user.id,
              email: user.email,
              name: user.name || undefined,
            };
          }
        } catch (error) {
          // For optional authentication, we don't fail on invalid tokens
          // Just continue without setting user
        }
      }

      next();
    } catch (error) {
      // For optional authentication, we don't fail on service errors
      // Just continue without setting user
      console.warn('Optional authentication service error:', error);
      next();
    }
  };

  /**
   * Role-based authorization middleware
   * Note: Currently not used as we don't have roles, but included for future use
   */
  authorize = (requiredRoles: string[] = []) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'NOT_AUTHENTICATED',
        });
      }

      // If no roles required, just check authentication
      if (requiredRoles.length === 0) {
        return next();
      }

      // In a real app, you would check user roles here
      // For now, we'll just pass through
      next();
    };
  };

  /**
   * Check if user is authenticated (helper function)
   */
  requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED',
      });
    }
    next();
  };

  /**
   * Rate limiting for authentication endpoints
   */
  authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
    const attempts = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();

      // Clean up expired entries
      for (const [ip, data] of attempts.entries()) {
        if (now > data.resetTime) {
          attempts.delete(ip);
        }
      }

      // Get or create attempt record
      let attemptRecord = attempts.get(clientIP);
      if (!attemptRecord) {
        attemptRecord = { count: 0, resetTime: now + windowMs };
        attempts.set(clientIP, attemptRecord);
      }

      // Check if limit exceeded
      if (attemptRecord.count >= maxAttempts) {
        const resetIn = Math.ceil((attemptRecord.resetTime - now) / 1000);
        return res.status(429).json({
          success: false,
          message: `Too many authentication attempts. Try again in ${resetIn} seconds.`,
          error: 'RATE_LIMIT_EXCEEDED',
          retryAfter: resetIn,
        });
      }

      // Increment attempt count for failed requests
      res.on('finish', () => {
        if (res.statusCode === 401 || res.statusCode === 400) {
          attemptRecord!.count++;
        }
      });

      next();
    };
  };
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export middleware functions
export const authenticate = authMiddleware.authenticate;
export const optionalAuthenticate = authMiddleware.optionalAuthenticate;
export const authorize = authMiddleware.authorize;
export const requireAuth = authMiddleware.requireAuth;
export const authRateLimit = authMiddleware.authRateLimit;