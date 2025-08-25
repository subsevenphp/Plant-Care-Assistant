import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from './api';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  notificationsEnabled: boolean;
  hasPushToken: boolean;
  pushTokenLastUpdated: string | null;
}

class NotificationService {
  private pushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Initialize notification service - should be called on app start
   */
  async initialize(): Promise<void> {
    try {
      // Set up notification listeners
      this.setupNotificationListeners();
      
      // Request permissions and get push token
      await this.requestPermissions();
      await this.registerForPushNotifications();

      console.log('📱 Notification service initialized successfully');
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return false;
      }

      console.log('✅ Push notification permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Cannot get push token on simulator/emulator');
        return null;
      }

      // Get the push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId,
      });

      this.pushToken = tokenData.data;
      console.log('📱 Got push token:', this.pushToken);

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      // Send token to backend
      await this.sendTokenToBackend(this.pushToken);

      return this.pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Create notification channels for Android
   */
  private async createNotificationChannels(): Promise<void> {
    try {
      // Default channel
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
      });

      // Watering reminders channel
      await Notifications.setNotificationChannelAsync('watering_reminders', {
        name: 'Watering Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        description: 'Notifications about plants that need watering',
      });

      // Care tips channel
      await Notifications.setNotificationChannelAsync('care_tips', {
        name: 'Plant Care Tips',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#10B981',
        description: 'Helpful tips for caring for your plants',
      });

      // Health alerts channel
      await Notifications.setNotificationChannelAsync('health_alerts', {
        name: 'Plant Health Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250, 250, 250],
        lightColor: '#DC2626',
        description: 'Important alerts about plant health issues',
      });

      // Test notifications channel
      await Notifications.setNotificationChannelAsync('test', {
        name: 'Test Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#6B7280',
        description: 'Test notifications to verify functionality',
      });

      console.log('✅ Android notification channels created');
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  }

  /**
   * Set up notification listeners for when app receives notifications
   */
  private setupNotificationListeners(): void {
    // Listener for when notification is received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
      // Handle the notification (show custom UI, etc.)
    });

    // Listener for when user interacts with notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle different notification types
      if (data?.type === 'watering_reminder' && data?.plantId) {
        // Navigate to plant detail screen
        // This would need to be integrated with your navigation system
        console.log('Navigate to plant detail:', data.plantId);
      }
    });
  }

  /**
   * Send push token to backend for storage
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/register-token', {
        pushToken: token,
      });
      
      console.log('✅ Push token sent to backend successfully');
    } catch (error) {
      console.error('❌ Failed to send push token to backend:', error);
    }
  }

  /**
   * Update notification preferences on backend
   */
  async updateNotificationPreferences(enabled: boolean): Promise<boolean> {
    try {
      await apiClient.put('/notifications/preferences', {
        notificationsEnabled: enabled,
      });
      
      console.log(`✅ Notification preferences updated: ${enabled}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update notification preferences:', error);
      return false;
    }
  }

  /**
   * Get current notification settings from backend
   */
  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: NotificationSettings;
      }>('/notifications/settings');
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get notification settings:', error);
      return null;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      await apiClient.post('/notifications/test');
      console.log('✅ Test notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      return false;
    }
  }

  /**
   * Remove push token from backend
   */
  async removePushToken(): Promise<boolean> {
    try {
      await apiClient.delete('/notifications/token');
      this.pushToken = null;
      console.log('✅ Push token removed successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to remove push token:', error);
      return false;
    }
  }

  /**
   * Schedule a local notification (for testing or offline functionality)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    seconds: number = 5
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'local_test' },
        },
        trigger: { seconds },
      });
      
      console.log(`📱 Local notification scheduled for ${seconds} seconds`);
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  /**
   * Cancel all scheduled local notifications
   */
  async cancelAllLocalNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All local notifications cancelled');
    } catch (error) {
      console.error('Error cancelling local notifications:', error);
    }
  }

  /**
   * Get current push token
   */
  getCurrentPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Clean up listeners when service is destroyed
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    
    console.log('🧹 Notification service cleanup completed');
  }
}

// Create singleton instance
const notificationService = new NotificationService();
export default notificationService;