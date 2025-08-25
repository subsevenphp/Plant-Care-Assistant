import { z } from 'zod';

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one lowercase letter, one uppercase letter, and one number');

// Email validation schema
const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')
  .transform(email => email.toLowerCase().trim());

// Name validation schema
const nameSchema = z
  .string()
  .min(1, 'Name cannot be empty')
  .max(100, 'Name must be less than 100 characters')
  .trim()
  .optional();

// Register request validation schema
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
  }),
});

// Login request validation schema
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z
      .string()
      .min(1, 'Password is required')
      .max(128, 'Password must be less than 128 characters'),
  }),
});

// Refresh token request validation schema
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, 'Refresh token is required'),
  }),
});

// Change password request validation schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: passwordSchema,
  }),
});

// Update profile request validation schema
export const updateProfileSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema.optional(),
  }),
});

// Forgot password request validation schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

// Reset password request validation schema
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(1, 'Reset token is required'),
    password: passwordSchema,
  }),
});

// Type exports for controllers
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;