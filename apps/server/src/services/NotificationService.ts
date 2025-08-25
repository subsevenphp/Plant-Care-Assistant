import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: { [key: string]: any };
  sound?: 'default' | null;
  channelId?: string;
}

export interface PushToken {
  token: string;
  userId: string;
  platform?: 'ios' | 'android';
  isActive: boolean;
}

export interface WateringReminderData {
  plantId: string;
  plantName: string;
  daysOverdue: number;
  lastWatered: string;
}

class NotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true, // Use FCM v1 API
    });
  }

  /**
   * Send push notification to a single device
   * @param pushToken - The Expo push token
   * @param notification - The notification payload
   * @returns Promise<boolean>
   */
  async sendNotification(pushToken: string, notification: NotificationPayload): Promise<boolean> {
    try {
      // Check that the token is valid
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return false;
      }

      // Construct the notification message
      const message: ExpoPushMessage = {
        to: pushToken,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.sound === null ? null : 'default',
        channelId: notification.channelId || 'default',
        priority: 'high',
        badge: 1,
      };

      // Send the notification
      const ticketChunk = await this.expo.sendPushNotificationsAsync([message]);
      const ticket = ticketChunk[0];

      // Handle the response
      if (ticket.status === 'error') {
        console.error(`Error sending notification: ${ticket.message}`);
        if (ticket.details && ticket.details.error) {
          console.error(`Error details:`, ticket.details.error);
        }
        return false;
      }

      console.log(`Notification sent successfully. Ticket ID: ${ticket.id}`);
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send push notifications to multiple devices
   * @param notifications - Array of {pushToken, notification} objects
   * @returns Promise<{ successful: number, failed: number }>
   */
  async sendBulkNotifications(
    notifications: { pushToken: string; notification: NotificationPayload }[]
  ): Promise<{ successful: number; failed: number }> {
    try {
      const messages: ExpoPushMessage[] = [];
      
      // Build messages array
      for (const { pushToken, notification } of notifications) {
        if (!Expo.isExpoPushToken(pushToken)) {
          console.warn(`Skipping invalid push token: ${pushToken}`);
          continue;
        }

        messages.push({
          to: pushToken,
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound === null ? null : 'default',
          channelId: notification.channelId || 'default',
          priority: 'high',
          badge: 1,
        });
      }

      if (messages.length === 0) {
        console.warn('No valid push tokens provided');
        return { successful: 0, failed: 0 };
      }

      // Send notifications in chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      // Count successful and failed notifications
      let successful = 0;
      let failed = 0;

      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error(`Notification failed: ${ticket.message}`);
          failed++;
        } else {
          successful++;
        }
      }

      console.log(`Bulk notifications sent: ${successful} successful, ${failed} failed`);
      return { successful, failed };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return { successful: 0, failed: notifications.length };
    }
  }

  /**
   * Send watering reminder notification
   * @param pushToken - The user's push token
   * @param plantData - Plant information for the reminder
   * @returns Promise<boolean>
   */
  async sendWateringReminder(
    pushToken: string,
    plantData: WateringReminderData
  ): Promise<boolean> {
    const { plantName, daysOverdue } = plantData;
    
    let title: string;
    let body: string;

    if (daysOverdue === 0) {
      title = '💧 Time to water your plants!';
      body = `${plantName} needs watering today.`;
    } else if (daysOverdue === 1) {
      title = '🌱 Plant watering overdue!';
      body = `${plantName} needed watering yesterday. Don't forget!`;
    } else {
      title = '🚨 Plant needs attention!';
      body = `${plantName} is ${daysOverdue} days overdue for watering!`;
    }

    const notification: NotificationPayload = {
      title,
      body,
      data: {
        type: 'watering_reminder',
        plantId: plantData.plantId,
        plantName: plantData.plantName,
        daysOverdue: plantData.daysOverdue,
      },
      channelId: 'watering_reminders',
    };

    // For development/testing, also log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('🔔 Watering Reminder Notification:');
      console.log(`   📱 To: ${pushToken}`);
      console.log(`   🌿 Plant: ${plantName}`);
      console.log(`   📅 Days overdue: ${daysOverdue}`);
      console.log(`   💬 Message: ${body}`);
      console.log('---');
    }

    return await this.sendNotification(pushToken, notification);
  }

  /**
   * Send plant care tip notification
   * @param pushToken - The user's push token
   * @param tip - Care tip content
   * @returns Promise<boolean>
   */
  async sendCareTip(pushToken: string, tip: string): Promise<boolean> {
    const notification: NotificationPayload = {
      title: '🌱 Plant Care Tip',
      body: tip,
      data: {
        type: 'care_tip',
        tip,
      },
      channelId: 'care_tips',
    };

    return await this.sendNotification(pushToken, notification);
  }

  /**
   * Send plant health alert notification
   * @param pushToken - The user's push token
   * @param plantName - Name of the plant
   * @param alertType - Type of health alert
   * @returns Promise<boolean>
   */
  async sendHealthAlert(
    pushToken: string, 
    plantName: string, 
    alertType: 'overwatered' | 'underwatered' | 'pest' | 'disease'
  ): Promise<boolean> {
    const alerts = {
      overwatered: {
        title: '⚠️ Overwatering Alert',
        body: `${plantName} might be overwatered. Check the soil moisture.`,
      },
      underwatered: {
        title: '🏜️ Drought Alert',
        body: `${plantName} appears severely underwatered. Water immediately.`,
      },
      pest: {
        title: '🐛 Pest Alert',
        body: `Check ${plantName} for pests and treat if necessary.`,
      },
      disease: {
        title: '🦠 Disease Alert',
        body: `${plantName} may have signs of disease. Inspect closely.`,
      },
    };

    const alert = alerts[alertType];
    const notification: NotificationPayload = {
      title: alert.title,
      body: alert.body,
      data: {
        type: 'health_alert',
        plantName,
        alertType,
      },
      channelId: 'health_alerts',
    };

    return await this.sendNotification(pushToken, notification);
  }

  /**
   * Validate if a push token is valid
   * @param pushToken - The token to validate
   * @returns boolean
   */
  isValidPushToken(pushToken: string): boolean {
    return Expo.isExpoPushToken(pushToken);
  }

  /**
   * Get receipt for sent notifications (for tracking delivery)
   * @param receiptIds - Array of receipt IDs from tickets
   * @returns Promise<ExpoPushReceipt[]>
   */
  async getNotificationReceipts(receiptIds: string[]): Promise<ExpoPushReceipt[]> {
    try {
      const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
      const receipts: ExpoPushReceipt[] = [];

      for (const chunk of receiptIdChunks) {
        const receiptChunk = await this.expo.getPushNotificationReceiptsAsync(chunk);
        receipts.push(...Object.values(receiptChunk));
      }

      return receipts;
    } catch (error) {
      console.error('Error getting notification receipts:', error);
      return [];
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();
export default notificationService;