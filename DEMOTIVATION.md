# Demotivation App - React Native Implementation Guide

## Overview
Build a React Native app that sends scheduled motivational/demotivational notifications to users. Users can create multiple notification schedules with different frequencies and motivation percentages.

## Project Setup

### 1. Initialize React Native Project
```bash
npx @react-native-community/cli@latest init Demotivation --version 0.74.5
cd Demotivation
```

### 2. Install Dependencies
```bash
npm install @react-native-async-storage/async-storage react-native-push-notification @react-native-community/datetimepicker
```

### 3. Directory Structure
Create these directories:
```
src/
├── components/
├── screens/
├── services/
└── types/
```

## Core Files to Create

### 1. Types Definition (`src/types/Schedule.ts`)
```typescript
export interface Schedule {
  id?: number;
  name: string;
  frequency: 'Hourly' | 'Daily' | 'Weekly';
  hour: number;
  minute: number;
  motivationPercentage: number; // 0-100
  isEnabled: boolean;
}
```

### 2. Message Service (`src/services/MessageService.ts`)
```typescript
const MOTIVATIONAL_MESSAGES = [
  "You are capable of amazing things!",
  "Every day is a new opportunity to grow.",
  "Believe in yourself and your abilities.",
  "You have the strength to overcome any challenge.",
  "Your potential is limitless.",
  "Today is your day to shine!",
  "You are making progress, even if you can't see it.",
  "Your hard work will pay off.",
];

const DEMOTIVATIONAL_MESSAGES = [
  "You're probably not as special as you think you are.",
  "Most people won't remember what you did today.",
  "Your problems aren't that unique.",
  "You'll probably give up on this goal like the others.",
  "Nobody cares as much as you think they do.",
  "You're overthinking this.",
  "This too shall pass... into obscurity.",
  "You're just average, and that's okay.",
];

export class MessageService {
  static getRandomMessage(isMotivational: boolean): string {
    const messages = isMotivational ? MOTIVATIONAL_MESSAGES : DEMOTIVATIONAL_MESSAGES;
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }
}
```

### 3. Notification Service (`src/services/NotificationService.ts`)
```typescript
import PushNotification from 'react-native-push-notification';
import {Platform} from 'react-native';
import {MessageService} from './MessageService';
import {Schedule} from '../types/Schedule';

export class NotificationService {
  static initialize() {
    PushNotification.configure({
      onNotification: function(notification) {
        console.log('NOTIFICATION:', notification);
      },
      requestPermissions: Platform.OS === 'ios',
    });

    PushNotification.createChannel(
      {
        channelId: 'demotivation_channel',
        channelName: 'Daily Messages',
        channelDescription: 'Daily messages',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
  }

  static requestPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      PushNotification.requestPermissions()
        .then((result) => {
          resolve(result.alert || result.sound || result.badge);
        })
        .catch(() => resolve(false));
    });
  }

  static cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  static scheduleAllEnabledNotifications(schedules: Schedule[]) {
    this.cancelAllNotifications();
    
    const enabledSchedules = schedules.filter(s => s.isEnabled);
    
    enabledSchedules.forEach((schedule, scheduleIndex) => {
      this.scheduleNotificationsForSchedule(schedule, scheduleIndex * 1000);
    });
  }

  private static scheduleNotificationsForSchedule(schedule: Schedule, baseId: number) {
    const now = new Date();
    
    switch (schedule.frequency) {
      case 'Hourly':
        this.scheduleHourlyNotifications(schedule.motivationPercentage, baseId, schedule.minute);
        break;
      case 'Daily':
        let scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), schedule.hour, schedule.minute);
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        this.scheduleDailyNotifications(scheduledTime, schedule.motivationPercentage, baseId);
        break;
      case 'Weekly':
        let weeklyTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), schedule.hour, schedule.minute);
        if (weeklyTime <= now) {
          weeklyTime.setDate(weeklyTime.getDate() + 1);
        }
        this.scheduleWeeklyNotifications(weeklyTime, schedule.motivationPercentage, baseId);
        break;
    }
  }

  private static scheduleHourlyNotifications(motivationPercentage: number, baseId: number, minutesPastHour: number) {
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const scheduledTime = new Date(now);
      scheduledTime.setHours(now.getHours() + i + 1, minutesPastHour, 0, 0);
      
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      this.scheduleNotification(baseId + i, scheduledTime, motivationPercentage);
    }
  }

  private static scheduleDailyNotifications(initialTime: Date, motivationPercentage: number, baseId: number) {
    for (let i = 0; i < 7; i++) {
      const scheduledTime = new Date(initialTime);
      scheduledTime.setDate(initialTime.getDate() + i);
      this.scheduleNotification(baseId + i, scheduledTime, motivationPercentage);
    }
  }

  private static scheduleWeeklyNotifications(initialTime: Date, motivationPercentage: number, baseId: number) {
    for (let i = 0; i < 4; i++) {
      const scheduledTime = new Date(initialTime);
      scheduledTime.setDate(initialTime.getDate() + (i * 7));
      this.scheduleNotification(baseId + i, scheduledTime, motivationPercentage);
    }
  }

  private static scheduleNotification(id: number, scheduledTime: Date, motivationPercentage: number) {
    try {
      const isMotivational = Math.random() * 100 < motivationPercentage;
      const messageContent = MessageService.getRandomMessage(isMotivational);

      PushNotification.localNotificationSchedule({
        id: id.toString(),
        title: 'Demotivation',
        message: messageContent,
        date: scheduledTime,
        channelId: 'demotivation_channel',
        importance: 'high',
        priority: 'high',
      });
    } catch (e) {
      console.error(`Error scheduling notification ${id}:`, e);
    }
  }
}
```

### 4. Schedule Card Component (`src/components/ScheduleCard.tsx`)
```typescript
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Switch} from 'react-native';
import {Schedule} from '../types/Schedule';

interface ScheduleCardProps {
  schedule: Schedule;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{schedule.name}</Text>
        <Switch value={schedule.isEnabled} onValueChange={onToggle} />
      </View>
      
      <Text style={styles.frequency}>
        {schedule.frequency} at {formatTime(schedule.hour, schedule.minute)}
      </Text>
      
      <Text style={styles.motivation}>
        Motivational: {schedule.motivationPercentage}%
      </Text>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  frequency: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  motivation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
});
```

### 5. Schedule Form Component (`src/components/ScheduleForm.tsx`)
Create a form component with:
- Text input for schedule name
- Frequency selector (Hourly/Daily/Weekly buttons)
- Time picker using DateTimePicker
- Motivation percentage slider (0-100)
- Save/Cancel buttons

### 6. Main App Component (`App.tsx`)
Replace the default App.tsx with:
- State management for schedules using AsyncStorage
- Initialize NotificationService on app start
- Request notification permissions
- Main UI with schedule list, empty state, and add button
- Modal for schedule form
- CRUD operations for schedules

### 7. Android Configuration

#### Update `android/app/src/main/AndroidManifest.xml`:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>

    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:allowBackup="false"
      android:theme="@style/AppTheme">
      
      <activity android:name=".MainActivity" ... >
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
      </activity>
      
      <!-- Push notification receivers -->
      <receiver android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationActions" />
      <receiver android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationPublisher" />
      <receiver android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationBootEventReceiver">
          <intent-filter>
              <action android:name="android.intent.action.BOOT_COMPLETED" />
              <action android:name="android.intent.action.QUICKBOOT_POWERON" />
              <action android:name="com.htc.intent.action.QUICKBOOT_POWERON"/>
              <category android:name="android.intent.category.DEFAULT" />
          </intent-filter>
      </receiver>

      <service
          android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationListenerService"
          android:exported="false" >
          <intent-filter>
              <action android:name="com.google.firebase.MESSAGING_EVENT" />
          </intent-filter>
      </service>
    </application>
</manifest>
```

#### Create `android/local.properties`:
```
sdk.dir=/home/matt/Android/Sdk
```

## Key Features to Implement

### 1. Schedule Management
- Create, read, update, delete schedules
- Store schedules in AsyncStorage
- Each schedule has: name, frequency, time, motivation percentage, enabled status

### 2. Notification Scheduling
- Schedule notifications based on frequency:
  - **Hourly**: Every hour at specified minute (next 24 hours)
  - **Daily**: Once per day at specified time (next 7 days)
  - **Weekly**: Once per week at specified time (next 4 weeks)
- Cancel all notifications when updating schedules
- Use inexact scheduling (no special permissions needed)

### 3. Message Selection
- Random selection based on motivation percentage
- If percentage is 70%, then 70% chance of motivational message, 30% demotivational

### 4. User Interface
- **Home Screen**: List of schedules with enable/disable switches
- **Empty State**: Prompt to create first schedule
- **Add/Edit Screen**: Form to create or modify schedules
- **Schedule Cards**: Show name, frequency, time, motivation percentage, and actions

### 5. Permissions
- Request notification permissions on first schedule creation
- Handle permission denied gracefully

## Build Commands
```bash
# Debug build
npx react-native run-android

# Release build (if needed)
npx react-native build-android --mode=release
```

## Testing Checklist
1. ✅ Create schedules with different frequencies
2. ✅ Enable/disable schedules
3. ✅ Edit and delete schedules
4. ✅ Verify notifications appear at scheduled times
5. ✅ Check motivation percentage affects message type
6. ✅ Test app restart (schedules persist)
7. ✅ Test permission handling

## Common Issues & Solutions

### Notification Issues
- Verify all Android permissions are added
- Ensure notification channel is created
- Check device notification settings
- Test on real device (not emulator)

This guide should provide everything needed to build a fully functional demotivation app that reliably sends scheduled notifications.
