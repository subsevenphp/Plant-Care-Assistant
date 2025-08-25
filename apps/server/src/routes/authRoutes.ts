import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate, authRateLimit } from '../middleware/authMiddleware';
import { validate, asyncHandler } from '../middleware/validation';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../utils/authValidation';

const router = Router();
const authController = new AuthController();

// Apply rate limiting to auth endpoints
const strictRateLimit = authRateLimit(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const normalRateLimit = authRateLimit(10, 15 * 60 * 1000); // 10 attempts per 15 minutes

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    email, password, name?
 */
router.post(
  '/register',
  strictRateLimit,
  validate(registerSchema),
  asyncHandler(authController.register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT tokens
 * @access  Public
 * @body    email, password
 */
router.post(
  '/login',
  strictRateLimit,
  validate(loginSchema),
  asyncHandler(authController.login)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    refreshToken
 */
router.post(
  '/refresh',
  normalRateLimit,
  validate(refreshTokenSchema),
  asyncHandler(authController.refreshToken)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getProfile)
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 * @body    name?, email?
 */
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(authController.updateProfile)
);

/**
 * @route   PUT /api/auth/password
 * @desc    Change user password
 * @access  Private
 * @body    currentPassword, newPassword
 */
router.put(
  '/password',
  authenticate,
  strictRateLimit,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if current token is valid
 * @access  Private
 */
router.get(
  '/verify',
  authenticate,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user,
      },
    });
  }
);

export default router;