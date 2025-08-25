import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Switch,
  Button,
  Divider,
  List,
  ActivityIndicator,
  Snackbar,
  useTheme,
  Paragraph,
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import notificationService, { NotificationSettings } from '../services/notificationService';

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const currentSettings = await notificationService.getNotificationSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      showSnackbar('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    try {
      setIsUpdating(true);
      const success = await notificationService.updateNotificationPreferences(enabled);
      
      if (success) {
        setSettings(prev => prev ? { ...prev, notificationsEnabled: enabled } : null);
        showSnackbar(`Notifications ${enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        showSnackbar('Failed to update notification preferences');
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      showSnackbar('Failed to update notification preferences');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      setIsUpdating(true);
      const granted = await notificationService.requestPermissions();
      
      if (granted) {
        const token = await notificationService.registerForPushNotifications();
        if (token) {
          showSnackbar('Notification permissions granted successfully');
          await loadSettings();
        } else {
          showSnackbar('Failed to register for notifications');
        }
      } else {
        Alert.alert(
          'Permissions Required',
          'To receive watering reminders and plant care notifications, please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                // In a real app, you might use Linking.openSettings()
                showSnackbar('Please enable notifications in device settings');
              }
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      showSnackbar('Failed to request notification permissions');
    } finally {
      setIsUpdating(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      setIsUpdating(true);
      const success = await notificationService.sendTestNotification();
      
      if (success) {
        showSnackbar('Test notification sent! Check your notifications.');
      } else {
        showSnackbar('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      showSnackbar('Failed to send test notification');
    } finally {
      setIsUpdating(false);
    }
  };

  const removeNotifications = async () => {
    Alert.alert(
      'Remove Notifications',
      'This will disable all push notifications for this app. You can re-enable them later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true);
              const success = await notificationService.removePushToken();
              
              if (success) {
                showSnackbar('Notifications removed successfully');
                await loadSettings();
              } else {
                showSnackbar('Failed to remove notifications');
              }
            } catch (error) {
              console.error('Error removing notifications:', error);
              showSnackbar('Failed to remove notifications');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Title style={[styles.title, { color: theme.colors.onSurface }]}>
          Notification Settings
        </Title>

        {/* Main Settings Card */}
        <Card style={styles.card}>
          <Card.Content>
            <List.Item
              title="Push Notifications"
              description={
                settings?.notificationsEnabled
                  ? "Receive watering reminders and plant care tips"
                  : "Notifications are currently disabled"
              }
              right={() => (
                <Switch
                  value={settings?.notificationsEnabled || false}
                  onValueChange={toggleNotifications}
                  disabled={isUpdating || !settings?.hasPushToken}
                />
              )}
            />

            <Divider style={styles.divider} />

            <View style={styles.statusContainer}>
              <Text style={styles.statusTitle}>Status:</Text>
              <Text 
                style={[
                  styles.statusValue, 
                  { 
                    color: settings?.hasPushToken 
                      ? theme.colors.primary 
                      : theme.colors.error 
                  }
                ]}
              >
                {settings?.hasPushToken ? '✅ Connected' : '❌ Not Connected'}
              </Text>
            </View>

            {settings?.pushTokenLastUpdated && (
              <Text style={styles.lastUpdated}>
                Last updated: {new Date(settings.pushTokenLastUpdated).toLocaleDateString()}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Information Card */}
        <Card style={styles.card}>
          <Card.Content>
            <List.Item
              title="Watering Reminders"
              description="Get notified when your plants need watering"
              left={(props) => <List.Icon {...props} icon="water" />}
            />
            <List.Item
              title="Plant Care Tips"
              description="Receive helpful tips for plant care"
              left={(props) => <List.Icon {...props} icon="lightbulb-outline" />}
            />
            <List.Item
              title="Health Alerts"
              description="Important notifications about plant health"
              left={(props) => <List.Icon {...props} icon="alert" />}
            />
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!settings?.hasPushToken ? (
            <Button
              mode="contained"
              onPress={handleRequestPermissions}
              loading={isUpdating}
              disabled={isUpdating}
              style={styles.button}
              icon="bell"
            >
              Enable Notifications
            </Button>
          ) : (
            <>
              <Button
                mode="outlined"
                onPress={sendTestNotification}
                loading={isUpdating}
                disabled={isUpdating || !settings?.notificationsEnabled}
                style={styles.button}
                icon="bell-ring"
              >
                Send Test Notification
              </Button>

              <Button
                mode="outlined"
                onPress={removeNotifications}
                loading={isUpdating}
                disabled={isUpdating}
                style={[styles.button, styles.dangerButton]}
                icon="bell-off"
                textColor={theme.colors.error}
              >
                Remove Notifications
              </Button>
            </>
          )}
        </View>

        {/* Info Section */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.infoTitle}>About Notifications</Title>
            <Paragraph style={styles.infoText}>
              We'll send you helpful reminders when your plants need watering, 
              along with care tips to keep your plants healthy. You can disable 
              notifications at any time in these settings.
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  divider: {
    marginVertical: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  buttonContainer: {
    gap: 12,
    marginVertical: 8,
  },
  button: {
    marginBottom: 8,
  },
  dangerButton: {
    borderColor: '#DC2626',
  },
  infoCard: {
    marginTop: 8,
    backgroundColor: '#F0F9FF',
  },
  infoTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
});