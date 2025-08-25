import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/authMiddleware';
import { validate, asyncHandler } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const notificationController = new NotificationController();

// Apply authentication to all notification routes
router.use(authenticate);

// Validation schemas
const registerTokenSchema = z.object({
  body: z.object({
    pushToken: z.string().min(1, 'Push token is required'),
  }),
});

const updatePreferencesSchema = z.object({
  body: z.object({
    notificationsEnabled: z.boolean(),
  }),
});

/**
 * @route   POST /api/notifications/register-token
 * @desc    Register or update user's push notification token
 * @access  Private
 * @body    pushToken: string
 */
router.post(
  '/register-token',
  validate(registerTokenSchema),
  asyncHandler(notificationController.registerPushToken)
);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update user's notification preferences
 * @access  Private
 * @body    notificationsEnabled: boolean
 */
router.put(
  '/preferences',
  validate(updatePreferencesSchema),
  asyncHandler(notificationController.updateNotificationPreferences)
);

/**
 * @route   GET /api/notifications/settings
 * @desc    Get user's current notification settings
 * @access  Private
 */
router.get(
  '/settings',
  asyncHandler(notificationController.getNotificationSettings)
);

/**
 * @route   POST /api/notifications/test
 * @desc    Send a test notification to the user
 * @access  Private
 */
router.post(
  '/test',
  asyncHandler(notificationController.sendTestNotification)
);

/**
 * @route   DELETE /api/notifications/token
 * @desc    Remove user's push notification token
 * @access  Private
 */
router.delete(
  '/token',
  asyncHandler(notificationController.removePushToken)
);

// Admin/Debug routes (in production, add admin middleware)
/**
 * @route   POST /api/notifications/trigger-watering-check
 * @desc    Manually trigger the watering reminders check (debug/admin)
 * @access  Private (should be admin only in production)
 */
router.post(
  '/trigger-watering-check',
  asyncHandler(notificationController.triggerWateringCheck)
);

/**
 * @route   GET /api/notifications/cron-status
 * @desc    Get status of all cron jobs (debug/admin)
 * @access  Private (should be admin only in production)
 */
router.get(
  '/cron-status',
  asyncHandler(notificationController.getCronJobStatus)
);

export default router;