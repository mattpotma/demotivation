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

  private static scheduleNotificationsForSchedule(schedule: Schedule, baseId: number) {
    console.log(`Setting up ${schedule.frequency} schedule: ${schedule.name}`);
    
    const now = new Date();
    switch (schedule.frequency) {
      case 'Hourly':
        this.scheduleHourlyNotifications(schedule, baseId);
        break;
      case 'Daily':
        this.scheduleDailyNotifications(schedule, baseId);
        break;
      case 'Weekly':
        this.scheduleWeeklyNotifications(schedule, baseId);
        break;
    }
  }

  private static scheduleHourlyNotifications(schedule: Schedule, baseId: number) {
    const now = new Date();
    console.log(`Hourly notifications at :${schedule.minute.toString().padStart(2, '0')}`);
    
    // Schedule for the next few hours as a demo
    for (let i = 0; i < 3; i++) {
      const scheduledTime = new Date(now);
      scheduledTime.setHours(now.getHours() + i, schedule.minute, 0, 0);
      
      if (scheduledTime > now) {
        this.scheduleNotification(baseId + i, scheduledTime, schedule);
      }
    }
  }

  private static scheduleDailyNotifications(schedule: Schedule, baseId: number) {
    const now = new Date();
    const time = `${schedule.hour.toString().padStart(2, '0')}:${schedule.minute.toString().padStart(2, '0')}`;
    console.log(`Daily notifications at ${time}`);
    
    // Schedule for the next few days as a demo
    for (let i = 0; i < 3; i++) {
      const scheduledTime = new Date(now);
      scheduledTime.setDate(now.getDate() + i);
      scheduledTime.setHours(schedule.hour, schedule.minute, 0, 0);
      
      if (scheduledTime > now) {
        this.scheduleNotification(baseId + i, scheduledTime, schedule);
      }
    }
  }

  private static scheduleWeeklyNotifications(schedule: Schedule, baseId: number) {
    const now = new Date();
    const weekTime = `${schedule.hour.toString().padStart(2, '0')}:${schedule.minute.toString().padStart(2, '0')}`;
    console.log(`Weekly notifications at ${weekTime}`);
    
    const scheduledTime = new Date(now);
    scheduledTime.setDate(now.getDate() + 7);
    scheduledTime.setHours(schedule.hour, schedule.minute, 0, 0);
    
    if (scheduledTime > now) {
      this.scheduleNotification(baseId, scheduledTime, schedule);
    }
  }

  private static scheduleNotification(id: number, scheduledTime: Date, schedule: Schedule) {
    const delay = scheduledTime.getTime() - Date.now();
    
    if (delay > 0) {
      console.log(`Notification ${id} scheduled for ${scheduledTime.toLocaleString()} (in ${Math.round(delay/1000)}s)`);
      
      setTimeout(async () => {
        const isMotivational = Math.random() * 100 < schedule.motivationPercentage;
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