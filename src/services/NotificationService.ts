import {} from 'react-native';
import notifee, {AndroidImportance, TriggerType} from '@notifee/react-native';
import {MessageService} from './MessageService';
import {Schedule} from '../types/Schedule';

export class NotificationService {
  private static logs: string[] = [];

  static initialize() {
    console.log('NotificationService initialized');
    this.log('NotificationService initialized');
  }

  private static log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs.shift();
    }
  }

  static getLogs(): string[] {
    return [...this.logs];
  }

  static clearLogs() {
    this.logs = [];
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      // Use Notifee's permission request
      const settings = await notifee.requestPermission();
      this.log(`Notification permission: ${settings.authorizationStatus}`);
      return settings.authorizationStatus >= 1; // 1 = granted
    } catch (error) {
      this.log(`Permission request error: ${error}`);
      return false;
    }
  }

  static async cancelAllNotifications() {
    try {
      await notifee.cancelAllNotifications();
      this.log('All notifications cancelled');
    } catch (error) {
      this.log(`Error cancelling notifications: ${error}`);
    }
  }

  static async getScheduledNotifications() {
    try {
      const triggerNotifications = await notifee.getTriggerNotifications();
      const displayedNotifications = await notifee.getDisplayedNotifications();

      console.log('=== NOTIFICATION DEBUG ===');
      console.log(`Trigger notifications: ${triggerNotifications.length}`);
      triggerNotifications.forEach((notification, index) => {
        const trigger = notification.trigger as any;
        const timestamp = trigger?.timestamp;
        const date = timestamp
          ? new Date(timestamp).toLocaleString()
          : 'Unknown';
        console.log(
          `${index + 1}. ID: ${
            notification.notification.id
          }, Time: ${date}, Title: ${notification.notification.title}`,
        );
      });

      console.log(`Displayed notifications: ${displayedNotifications.length}`);
      displayedNotifications.forEach((notification, index) => {
        console.log(
          `${index + 1}. ID: ${notification.id}, Title: ${notification.title}`,
        );
      });
      console.log('=== END DEBUG ===');

      return {
        trigger: triggerNotifications,
        displayed: displayedNotifications,
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return {trigger: [], displayed: []};
    }
  }

  static async scheduleAllEnabledNotifications(schedules: Schedule[]) {
    try {
      this.log('=== SCHEDULING START ===');
      this.log(`Total schedules received: ${schedules.length}`);

      await this.cancelAllNotifications();

      const enabledSchedules = schedules.filter(s => s.isEnabled);
      this.log(`Enabled schedules: ${enabledSchedules.length}`);
      enabledSchedules.forEach(s =>
        this.log(`  - ${s.name}: enabled=${s.isEnabled}`),
      );

      if (enabledSchedules.length === 0) {
        this.log('No enabled schedules found, skipping scheduling');
        return;
      }

      for (const [scheduleIndex, schedule] of enabledSchedules.entries()) {
        this.log(
          `Processing schedule ${scheduleIndex + 1}/${
            enabledSchedules.length
          }: ${schedule.name}`,
        );
        await this.scheduleNotificationsForSchedule(
          schedule,
          scheduleIndex * 1000,
        );
      }

      this.log('=== SCHEDULING COMPLETE ===');

      // Debug: Show all scheduled notifications
      setTimeout(() => {
        this.getScheduledNotifications();
      }, 1000);
    } catch (error) {
      this.log(`Error in scheduleAllEnabledNotifications: ${error}`);
    }
  }

  private static async scheduleNotificationsForSchedule(
    schedule: any,
    baseId: number,
  ) {
    try {
      this.log(
        `  Schedule: ${schedule.name}, hour: ${schedule.hour}, minute: ${
          schedule.minute
        }, daysOfWeek: [${schedule.daysOfWeek?.join(',')}], motivation: ${
          schedule.motivationPercentage
        }%`,
      );

      // Ensure we have daysOfWeek array
      if (!schedule.daysOfWeek || !Array.isArray(schedule.daysOfWeek)) {
        this.log(`  No daysOfWeek found for ${schedule.name}, skipping`);
        return;
      }

      const enabledDays = schedule.daysOfWeek
        ? schedule.daysOfWeek.filter((day: boolean) => day).length
        : 0;
      this.log(
        `  Setting up schedule: ${schedule.name} for ${enabledDays} days`,
      );

      if (enabledDays === 0) {
        this.log(`  No enabled days for ${schedule.name}, skipping`);
        return;
      }

      await this.scheduleWeeklyNotifications(schedule, baseId);
    } catch (error) {
      this.log(`  Error processing schedule ${schedule.name}: ${error}`);
    }
  }

  private static async scheduleWeeklyNotifications(
    schedule: any,
    baseId: number,
  ) {
    const now = new Date();
    const time = `${schedule.hour.toString().padStart(2, '0')}:${schedule.minute
      .toString()
      .padStart(2, '0')}`;
    this.log(`  Scheduling notifications at ${time} for enabled days`);

    // Ensure daysOfWeek exists
    if (!schedule.daysOfWeek || !Array.isArray(schedule.daysOfWeek)) {
      this.log('  No valid daysOfWeek found, skipping schedule');
      return;
    }

    // Schedule for the next 2 weeks to ensure we catch all enabled days
    for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
      for (
        let dayOfWeek = 0;
        dayOfWeek < schedule.daysOfWeek.length;
        dayOfWeek++
      ) {
        const isEnabled = schedule.daysOfWeek[dayOfWeek];
        if (!isEnabled) continue;

        // Find the next occurrence of this day of week
        const scheduledTime = new Date(now);
        const currentDayOfWeek = now.getDay();
        const daysUntilTarget = (dayOfWeek - currentDayOfWeek + 7) % 7;

        // Add the week offset
        scheduledTime.setDate(now.getDate() + daysUntilTarget + weekOffset * 7);
        scheduledTime.setHours(schedule.hour, schedule.minute, 0, 0);

        // If it's today but the time has passed, schedule for next week
        if (weekOffset === 0 && daysUntilTarget === 0 && scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 7);
        }

        if (scheduledTime > now) {
          const notificationId = baseId + weekOffset * 7 + dayOfWeek;
          await this.scheduleNotification(
            notificationId,
            scheduledTime,
            schedule,
          );
        }
      }
    }
  }

  private static async scheduleNotification(
    id: number,
    scheduledTime: Date,
    schedule: any,
  ) {
    const delay = scheduledTime.getTime() - Date.now();

    if (delay > 0) {
      this.log(
        `    Notification ${id} scheduled for ${scheduledTime.toLocaleString()} (in ${Math.round(
          delay / 1000,
        )}s)`,
      );

      // Use Notifee's trigger notifications for background delivery
      await this.scheduleBackgroundNotification(id, scheduledTime, schedule);
    }
  }

  private static async scheduleBackgroundNotification(
    id: number,
    scheduledTime: Date,
    schedule: any,
  ) {
    try {
      // Generate message content at scheduling time (not ideal but necessary for triggers)
      const isMotivational =
        Math.random() * 100 < schedule.motivationPercentage;
      const messageContent = await MessageService.getRandomMessage(
        isMotivational,
      );

      // Create notification channel with silent settings
      const channelId = await notifee.createChannel({
        id: 'demotivation',
        name: 'Demotivation Messages',
        importance: AndroidImportance.LOW,
        vibration: false,
      });

      // Schedule the notification to trigger at the specified time
      await notifee.createTriggerNotification(
        {
          id: id.toString(),
          title: '🎯 Demotivation',
          body: messageContent,
          android: {
            channelId,
            importance: AndroidImportance.LOW,
            smallIcon: 'ic_launcher',
            pressAction: {
              id: 'default',
            },
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: scheduledTime.getTime(),
        },
      );

      this.log(
        `    Background trigger notification ${id} scheduled: ${messageContent}`,
      );
    } catch (error) {
      this.log(`    Error scheduling background notification: ${error}`);
    }
  }
}
