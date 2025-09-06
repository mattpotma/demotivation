import {Platform, Alert, PermissionsAndroid, ToastAndroid} from 'react-native';
import notifee from '@notifee/react-native';
import {MessageService} from './MessageService';
import {Schedule} from '../types/Schedule';

export class NotificationService {
  static initialize() {
    console.log('NotificationService initialized');
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      // Use Notifee's permission request
      const settings = await notifee.requestPermission();
      console.log('Notification permission:', settings.authorizationStatus);
      return settings.authorizationStatus >= 1; // 1 = granted
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  static cancelAllNotifications() {
    console.log('All notifications cancelled (simulated)');
  }

  static scheduleAllEnabledNotifications(schedules: Schedule[]) {
    this.cancelAllNotifications();

    const enabledSchedules = schedules.filter(s => s.isEnabled);

    console.log(`Scheduling ${enabledSchedules.length} enabled schedules`);

    enabledSchedules.forEach((schedule, scheduleIndex) => {
      this.scheduleNotificationsForSchedule(schedule, scheduleIndex * 1000);
    });
  }

  private static scheduleNotificationsForSchedule(
    schedule: any,
    baseId: number,
  ) {
    // Handle backward compatibility with old frequency format
    if (schedule.frequency && !schedule.daysOfWeek) {
      console.log(`Legacy schedule detected: ${schedule.name} (${schedule.frequency})`);
      // Convert old frequency to daysOfWeek for scheduling
      switch (schedule.frequency) {
        case 'Daily':
          schedule.daysOfWeek = [true, true, true, true, true, true, true];
          break;
        case 'Weekly':
          schedule.daysOfWeek = [false, false, false, false, false, false, false];
          break;
        case 'Hourly':
          schedule.daysOfWeek = [true, true, true, true, true, true, true];
          break;
        default:
          schedule.daysOfWeek = [false, false, false, false, false, false, false];
      }
    }
    
    const enabledDays = schedule.daysOfWeek ? schedule.daysOfWeek.filter((day: boolean) => day).length : 0;
    console.log(
      `Setting up schedule: ${schedule.name} for ${enabledDays} days`,
    );

    this.scheduleWeeklyNotifications(schedule, baseId);
  }

  private static scheduleWeeklyNotifications(
    schedule: any,
    baseId: number,
  ) {
    const now = new Date();
    const time = `${schedule.hour.toString().padStart(2, '0')}:${schedule.minute
      .toString()
      .padStart(2, '0')}`;
    console.log(`Scheduling notifications at ${time} for enabled days`);

    // Ensure daysOfWeek exists
    if (!schedule.daysOfWeek || !Array.isArray(schedule.daysOfWeek)) {
      console.log('No valid daysOfWeek found, skipping schedule');
      return;
    }

    // Schedule for the next 2 weeks to ensure we catch all enabled days
    for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
      schedule.daysOfWeek.forEach((isEnabled: boolean, dayOfWeek: number) => {
        if (!isEnabled) return;

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
          this.scheduleNotification(notificationId, scheduledTime, schedule);
        }
      });
    }
  }

  private static scheduleNotification(
    id: number,
    scheduledTime: Date,
    schedule: any,
  ) {
    const delay = scheduledTime.getTime() - Date.now();

    if (delay > 0) {
      console.log(
        `Notification ${id} scheduled for ${scheduledTime.toLocaleString()} (in ${Math.round(
          delay / 1000,
        )}s)`,
      );

      setTimeout(async () => {
        const isMotivational =
          Math.random() * 100 < schedule.motivationPercentage;
        const messageContent = MessageService.getRandomMessage(isMotivational);

        try {
          // Create notification channel
          const channelId = await notifee.createChannel({
            id: 'demotivation',
            name: 'Demotivation Messages',
            importance: 2, // Low importance
          });

          // Display the notification
          await notifee.displayNotification({
            title: '🎯 Demotivation',
            body: messageContent,
            android: {
              channelId,
              importance: 2,
              smallIcon: 'ic_launcher',
              pressAction: {
                id: 'default',
              },
            },
          });

          console.log(`Push notification sent: ${messageContent}`);
        } catch (error) {
          console.error('Error sending notification:', error);
          // Fallback to alert
          Alert.alert('🎯 Demotivation', messageContent, [{text: 'OK'}]);
        }
      }, delay);
    }
  }
}
