import { Request, Response } from 'express';
import { prisma } from '../config/database';
import notificationService from '../services/NotificationService';
import cronJobService from '../services/CronJobService';

export class NotificationController {
  /**
   * Register or update user's push token
   * POST /api/notifications/register-token
   */
  registerPushToken = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { pushToken } = req.body;

      if (!pushToken) {
        return res.status(400).json({
          success: false,
          message: 'Push token is required',
        });
      }

      // Validate the push token
      if (!notificationService.isValidPushToken(pushToken)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid push token format',
        });
      }

      // Update user's push token
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          pushToken,
          pushTokenUpdatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          pushToken: true,
          notificationsEnabled: true,
        },
      });

      console.log(`📱 Push token registered for user ${updatedUser.email}`);

      res.status(200).json({
        success: true,
        message: 'Push token registered successfully',
        data: {
          pushTokenRegistered: true,
          notificationsEnabled: updatedUser.notificationsEnabled,
        },
      });
    } catch (error) {
      console.error('Error registering push token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register push token',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Update user's notification preferences
   * PUT /api/notifications/preferences
   */
  updateNotificationPreferences = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { notificationsEnabled } = req.body;

      if (typeof notificationsEnabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'notificationsEnabled must be a boolean value',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { notificationsEnabled },
        select: {
          id: true,
          email: true,
          notificationsEnabled: true,
        },
      });

      console.log(`🔔 Notification preferences updated for user ${updatedUser.email}: ${notificationsEnabled}`);

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: {
          notificationsEnabled: updatedUser.notificationsEnabled,
        },
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get user's notification settings
   * GET /api/notifications/settings
   */
  getNotificationSettings = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          notificationsEnabled: true,
          pushToken: true,
          pushTokenUpdatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification settings retrieved successfully',
        data: {
          notificationsEnabled: user.notificationsEnabled,
          hasPushToken: !!user.pushToken,
          pushTokenLastUpdated: user.pushTokenUpdatedAt,
        },
      });
    } catch (error) {
      console.error('Error getting notification settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Send test notification to user
   * POST /api/notifications/test
   */
  sendTestNotification = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          pushToken: true,
          notificationsEnabled: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (!user.notificationsEnabled) {
        return res.status(400).json({
          success: false,
          message: 'Notifications are disabled for this user',
        });
      }

      if (!user.pushToken) {
        return res.status(400).json({
          success: false,
          message: 'No push token registered for this user',
        });
      }

      // Send test notification
      const success = await notificationService.sendNotification(user.pushToken, {
        title: '🧪 Test Notification',
        body: `Hello ${user.name || 'there'}! Your Plant Care notifications are working perfectly.`,
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
        },
        channelId: 'test',
      });

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Test notification sent successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send test notification',
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Manually trigger watering reminders check (admin only)
   * POST /api/notifications/trigger-watering-check
   */
  triggerWateringCheck = async (req: Request, res: Response) => {
    try {
      // In production, you might want to add admin authentication here
      console.log('🔄 Manual watering check triggered by user:', req.user!.email);
      
      await cronJobService.triggerWateringCheck();

      res.status(200).json({
        success: true,
        message: 'Watering reminder check triggered successfully',
      });
    } catch (error) {
      console.error('Error triggering watering check:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger watering check',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get cron job status (admin only)
   * GET /api/notifications/cron-status
   */
  getCronJobStatus = async (req: Request, res: Response) => {
    try {
      const jobsStatus = cronJobService.getJobsStatus();

      res.status(200).json({
        success: true,
        message: 'Cron job status retrieved successfully',
        data: {
          jobs: jobsStatus,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error getting cron job status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cron job status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Remove user's push token
   * DELETE /api/notifications/token
   */
  removePushToken = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      await prisma.user.update({
        where: { id: userId },
        data: {
          pushToken: null,
          pushTokenUpdatedAt: null,
        },
      });

      console.log(`🗑️ Push token removed for user ${req.user!.email}`);

      res.status(200).json({
        success: true,
        message: 'Push token removed successfully',
      });
    } catch (error) {
      console.error('Error removing push token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove push token',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}