import * as cron from 'node-cron';
import { prisma } from '../config/database';
import notificationService, { WateringReminderData } from './NotificationService';

class CronJobService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize all cron jobs
   */
  initializeJobs(): void {
    this.scheduleWateringReminders();
    this.scheduleTokenCleanup();
    console.log('✅ Cron jobs initialized successfully');
  }

  /**
   * Schedule daily watering reminders
   * Runs every day at 9:00 AM
   */
  private scheduleWateringReminders(): void {
    const job = cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Running daily watering reminder check...');
      await this.checkWateringReminders();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC',
    });

    this.jobs.set('watering_reminders', job);
    console.log('📅 Scheduled daily watering reminders for 9:00 AM');
  }

  /**
   * Schedule cleanup of old/invalid push tokens
   * Runs every Sunday at 2:00 AM
   */
  private scheduleTokenCleanup(): void {
    const job = cron.schedule('0 2 * * 0', async () => {
      console.log('🧹 Running weekly push token cleanup...');
      await this.cleanupOldPushTokens();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC',
    });

    this.jobs.set('token_cleanup', job);
    console.log('📅 Scheduled weekly token cleanup for Sunday 2:00 AM');
  }

  /**
   * Check for plants that need watering and send reminders
   */
  private async checkWateringReminders(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all plants with their users
      const plants = await prisma.plant.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              pushToken: true,
              notificationsEnabled: true,
            },
          },
        },
      });

      console.log(`🌱 Checking ${plants.length} plants for watering reminders...`);

      let remindersProcessed = 0;
      let remindersSent = 0;
      const errors: string[] = [];

      for (const plant of plants) {
        try {
          // Skip if user doesn't have notifications enabled or no push token
          if (!plant.user.notificationsEnabled || !plant.user.pushToken) {
            continue;
          }

          // Calculate when the plant should next be watered
          const lastWatered = plant.lastWatered || plant.createdAt;
          const nextWateringDate = new Date(lastWatered);
          nextWateringDate.setDate(nextWateringDate.getDate() + plant.wateringFrequency);
          
          // Set time to beginning of day for comparison
          nextWateringDate.setHours(0, 0, 0, 0);

          // Check if watering is due or overdue
          if (nextWateringDate <= today) {
            remindersProcessed++;

            // Calculate days overdue
            const timeDiff = today.getTime() - nextWateringDate.getTime();
            const daysOverdue = Math.floor(timeDiff / (1000 * 3600 * 24));

            const reminderData: WateringReminderData = {
              plantId: plant.id,
              plantName: plant.name,
              daysOverdue,
              lastWatered: plant.lastWatered?.toISOString() || plant.createdAt.toISOString(),
            };

            // Send the reminder
            const success = await notificationService.sendWateringReminder(
              plant.user.pushToken,
              reminderData
            );

            if (success) {
              remindersSent++;
              
              // Log the reminder (for development/debugging)
              console.log(
                `📱 Reminder sent to ${plant.user.name || plant.user.email} for plant "${plant.name}" ` +
                `(${daysOverdue === 0 ? 'due today' : `${daysOverdue} days overdue`})`
              );
            } else {
              errors.push(`Failed to send reminder for plant "${plant.name}" to user ${plant.user.email}`);
            }

            // Add a small delay to avoid overwhelming the notification service
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          const errorMsg = `Error processing plant "${plant.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Log summary
      console.log(`✅ Watering reminders completed:`);
      console.log(`   📊 Plants checked: ${plants.length}`);
      console.log(`   🔔 Reminders processed: ${remindersProcessed}`);
      console.log(`   ✉️ Reminders sent successfully: ${remindersSent}`);
      console.log(`   ❌ Errors: ${errors.length}`);

      if (errors.length > 0) {
        console.error('❌ Errors during reminder processing:');
        errors.forEach(error => console.error(`   - ${error}`));
      }
    } catch (error) {
      console.error('❌ Critical error in watering reminder check:', error);
    }
  }

  /**
   * Clean up old or potentially invalid push tokens
   */
  private async cleanupOldPushTokens(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find users with push tokens older than 30 days
      const usersWithOldTokens = await prisma.user.findMany({
        where: {
          pushToken: { not: null },
          OR: [
            { pushTokenUpdatedAt: null },
            { pushTokenUpdatedAt: { lt: thirtyDaysAgo } },
          ],
        },
      });

      console.log(`🧹 Found ${usersWithOldTokens.length} users with potentially old push tokens`);

      let tokensRemoved = 0;

      for (const user of usersWithOldTokens) {
        if (user.pushToken && !notificationService.isValidPushToken(user.pushToken)) {
          // Remove invalid token
          await prisma.user.update({
            where: { id: user.id },
            data: {
              pushToken: null,
              pushTokenUpdatedAt: null,
            },
          });

          tokensRemoved++;
          console.log(`🗑️ Removed invalid push token for user ${user.email}`);
        }
      }

      console.log(`✅ Token cleanup completed. Removed ${tokensRemoved} invalid tokens.`);
    } catch (error) {
      console.error('❌ Error during push token cleanup:', error);
    }
  }

  /**
   * Manually trigger watering reminder check (for testing)
   */
  async triggerWateringCheck(): Promise<void> {
    console.log('🔄 Manually triggering watering reminder check...');
    await this.checkWateringReminders();
  }

  /**
   * Schedule a custom reminder for a specific plant
   * @param plantId - The plant ID
   * @param reminderDate - When to send the reminder
   */
  async scheduleCustomReminder(plantId: string, reminderDate: Date): Promise<void> {
    try {
      const plant = await prisma.plant.findUnique({
        where: { id: plantId },
        include: {
          user: {
            select: {
              pushToken: true,
              notificationsEnabled: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!plant || !plant.user.pushToken || !plant.user.notificationsEnabled) {
        console.warn(`Cannot schedule reminder for plant ${plantId}: user not found or notifications disabled`);
        return;
      }

      // Calculate cron expression for the specific date/time
      const cronExpression = `${reminderDate.getMinutes()} ${reminderDate.getHours()} ${reminderDate.getDate()} ${reminderDate.getMonth() + 1} *`;
      
      const job = cron.schedule(cronExpression, async () => {
        const reminderData: WateringReminderData = {
          plantId: plant.id,
          plantName: plant.name,
          daysOverdue: 0,
          lastWatered: plant.lastWatered?.toISOString() || plant.createdAt.toISOString(),
        };

        await notificationService.sendWateringReminder(plant.user.pushToken!, reminderData);
        
        // Remove the job after execution
        this.jobs.delete(`custom_${plantId}`);
        job.destroy();
      }, { 
        scheduled: true 
      });

      this.jobs.set(`custom_${plantId}`, job);
      console.log(`📅 Scheduled custom reminder for plant "${plant.name}" at ${reminderDate.toISOString()}`);
    } catch (error) {
      console.error(`Error scheduling custom reminder for plant ${plantId}:`, error);
    }
  }

  /**
   * Stop all cron jobs
   */
  stopAllJobs(): void {
    this.jobs.forEach((job, name) => {
      job.destroy();
      console.log(`⏹️ Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Get status of all running jobs
   */
  getJobsStatus(): { name: string; running: boolean }[] {
    const status: { name: string; running: boolean }[] = [];
    
    this.jobs.forEach((job, name) => {
      status.push({
        name,
        running: job.getStatus() === 'scheduled',
      });
    });

    return status;
  }
}

// Create singleton instance
const cronJobService = new CronJobService();
export default cronJobService;