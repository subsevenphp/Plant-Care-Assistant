import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../utils/authValidation';

export class AuthController {
  private authService: AuthService;
  private userRepository: UserRepository;

  constructor() {
    this.authService = new AuthService();
    this.userRepository = new UserRepository();
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  register = async (req: Request & RegisterRequest, res: Response) => {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Hash the password
      const hashedPassword = await this.authService.hashPassword(password);

      // Create the user
      const user = await this.userRepository.create({
        email,
        password: hashedPassword,
        name,
      });

      // Generate tokens
      const { accessToken, refreshToken } = this.authService.generateTokenPair(
        user.id,
        user.email,
        user.name || undefined
      );

      // Store refresh token
      await this.userRepository.storeRefreshToken(user.id, refreshToken);

      // Return success response (don't include password)
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      };

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Login user
   * POST /api/auth/login
   */
  login = async (req: Request & LoginRequest, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Compare password
      const isPasswordValid = await this.authService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.authService.generateTokenPair(
        user.id,
        user.email,
        user.name || undefined
      );

      // Store refresh token and update last login
      await Promise.all([
        this.userRepository.storeRefreshToken(user.id, refreshToken),
        this.userRepository.updateLastLogin(user.id),
      ]);

      // Return success response (don't include password)
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      };

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refreshToken = async (req: Request & RefreshTokenRequest, res: Response) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      let decoded;
      try {
        decoded = await this.authService.verifyRefreshToken(refreshToken);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
        });
      }

      // Find user by refresh token
      const user = await this.userRepository.findByRefreshToken(refreshToken);
      if (!user || user.id !== decoded.userId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = this.authService.generateTokenPair(
        user.id,
        user.email,
        user.name || undefined
      );

      // Store new refresh token
      await this.userRepository.storeRefreshToken(user.id, newRefreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken,
            refreshToken: newRefreshToken,
          },
        },
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Logout user (invalidate refresh token)
   * POST /api/auth/logout
   */
  logout = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Clear refresh token
      await this.userRepository.clearRefreshToken(userId);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Get user statistics
      const stats = await this.userRepository.getUserStats(userId);

      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        stats,
      };

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: userResponse,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  updateProfile = async (req: Request & UpdateProfileRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { name, email } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Check if email is being updated and if it's already taken
      if (email) {
        const isEmailTaken = await this.userRepository.isEmailTaken(email, userId);
        if (isEmailTaken) {
          return res.status(409).json({
            success: false,
            message: 'Email is already in use',
          });
        }
      }

      // Update user
      const updatedUser = await this.userRepository.update(userId, {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
      });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const userResponse = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        updatedAt: updatedUser.updatedAt,
      };

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: userResponse,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Change password
   * PUT /api/auth/password
   */
  changePassword = async (req: Request & ChangePasswordRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Find user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await this.authService.comparePassword(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedNewPassword = await this.authService.hashPassword(newPassword);

      // Update password and clear refresh token (force re-login)
      await this.userRepository.update(userId, {
        password: hashedNewPassword,
        refreshToken: null,
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please log in again.',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}