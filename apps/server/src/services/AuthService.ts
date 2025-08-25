import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * AuthService class for handling authentication operations
 * Provides password hashing and JWT token generation/verification
 */
export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '30d';

  /**
   * Hash a plain-text password using bcrypt
   * @param password - Plain-text password to hash
   * @returns Promise<string> - Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(AuthService.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare a plain-text password with a hashed password
   * @param password - Plain-text password to verify
   * @param hashedPassword - Hashed password to compare against
   * @returns Promise<boolean> - True if passwords match, false otherwise
   */
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      return isMatch;
    } catch (error) {
      console.error('Error comparing password:', error);
      throw new Error('Failed to compare password');
    }
  }

  /**
   * Generate a JWT access token for a user
   * @param userId - User ID to include in token
   * @param email - User email to include in token
   * @param name - User name to include in token (optional)
   * @returns string - JWT access token
   */
  generateToken(userId: string, email: string, name?: string): string {
    try {
      const payload: JWTPayload = {
        userId,
        email,
        ...(name && { name }),
      };

      const token = jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
        issuer: 'plant-care-api',
        audience: 'plant-care-users',
      });

      return token;
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Generate a refresh token for a user
   * @param userId - User ID to include in token
   * @param email - User email to include in token
   * @returns string - JWT refresh token
   */
  generateRefreshToken(userId: string, email: string): string {
    try {
      const payload: JWTPayload = {
        userId,
        email,
      };

      const refreshToken = jwt.sign(payload, jwtConfig.secret, {
        expiresIn: AuthService.REFRESH_TOKEN_EXPIRES_IN,
        issuer: 'plant-care-api',
        audience: 'plant-care-refresh',
      });

      return refreshToken;
    } catch (error) {
      console.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   * @param userId - User ID
   * @param email - User email
   * @param name - User name (optional)
   * @returns TokenPair - Object containing both tokens
   */
  generateTokenPair(userId: string, email: string, name?: string): TokenPair {
    const accessToken = this.generateToken(userId, email, name);
    const refreshToken = this.generateRefreshToken(userId, email);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token to verify
   * @returns Promise<JWTPayload> - Decoded token payload
   */
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new Error('Token not active');
      }
      
      console.error('Error verifying token:', error);
      throw new Error('Token verification failed');
    }
  }

  /**
   * Verify a refresh token specifically
   * @param refreshToken - Refresh token to verify
   * @returns Promise<JWTPayload> - Decoded token payload
   */
  async verifyRefreshToken(refreshToken: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(refreshToken, jwtConfig.secret) as JWTPayload;
      
      // Verify that this is actually a refresh token
      if (!refreshToken || decoded.aud !== 'plant-care-refresh') {
        throw new Error('Invalid refresh token');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      
      console.error('Error verifying refresh token:', error);
      throw new Error('Refresh token verification failed');
    }
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header value
   * @returns string | null - Extracted token or null if invalid format
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Check if a token is expired without throwing an error
   * @param token - JWT token to check
   * @returns boolean - True if token is expired, false otherwise
   */
  isTokenExpired(token: string): boolean {
    try {
      jwt.verify(token, jwtConfig.secret);
      return false;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return true;
      }
      // For other errors (invalid token, etc.), consider it "expired"
      return true;
    }
  }

  /**
   * Get token expiration time
   * @param token - JWT token
   * @returns number | null - Expiration timestamp or null if invalid
   */
  getTokenExpiration(token: string): number | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded.exp || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate a secure random string for various auth purposes
   * @param length - Length of the random string
   * @returns string - Random string
   */
  generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}