import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;
import 'dart:math';
import 'message_service.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    tz.initializeTimeZones();

    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
      requestSoundPermission: true,
      requestBadgePermission: true,
      requestAlertPermission: true,
    );

    const InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
      macOS: initializationSettingsIOS,
    );

    await _flutterLocalNotificationsPlugin.initialize(initializationSettings);
  }

  static Future<bool> requestPermissions() async {
    if (kIsWeb) return false;
    
    final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
        _flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();

    final bool? granted = await androidImplementation?.requestNotificationsPermission();
    return granted ?? false;
  }

  static Future<void> scheduleNotifications({
    required String frequency,
    required TimeOfDay time,
    required double motivationPercentage,
  }) async {
    if (kIsWeb) return;
    
    await cancelAllNotifications();

    final now = DateTime.now();
    DateTime scheduledTime = DateTime(now.year, now.month, now.day, time.hour, time.minute);
    
    if (scheduledTime.isBefore(now)) {
      scheduledTime = scheduledTime.add(const Duration(days: 1));
    }

    switch (frequency) {
      case 'Hourly':
        await _scheduleHourlyNotifications(motivationPercentage);
        break;
      case 'Daily':
        await _scheduleDailyNotifications(scheduledTime, motivationPercentage);
        break;
      case 'Weekly':
        await _scheduleWeeklyNotifications(scheduledTime, motivationPercentage);
        break;
    }
  }

  static Future<void> _scheduleHourlyNotifications(double motivationPercentage) async {
    for (int i = 0; i < 24; i++) {
      final now = DateTime.now();
      DateTime scheduledTime = DateTime(now.year, now.month, now.day, now.hour + i + 1);
      
      if (scheduledTime.isBefore(now)) {
        scheduledTime = scheduledTime.add(const Duration(days: 1));
      }

      await _scheduleNotification(i, scheduledTime, motivationPercentage);
    }
  }

  static Future<void> _scheduleDailyNotifications(DateTime initialTime, double motivationPercentage) async {
    for (int i = 0; i < 7; i++) {
      final scheduledTime = initialTime.add(Duration(days: i));
      await _scheduleNotification(i, scheduledTime, motivationPercentage);
    }
  }

  static Future<void> _scheduleWeeklyNotifications(DateTime initialTime, double motivationPercentage) async {
    for (int i = 0; i < 4; i++) {
      final scheduledTime = initialTime.add(Duration(days: i * 7));
      await _scheduleNotification(i, scheduledTime, motivationPercentage);
    }
  }

  static Future<void> _scheduleNotification(int id, DateTime scheduledTime, double motivationPercentage) async {
    final random = Random();
    final isMotivational = random.nextDouble() * 100 < motivationPercentage;
    
    final messageContent = MessageService.getRandomMessage(isMotivational);

    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'demotivation_channel',
      'Daily Messages',
      channelDescription: 'Daily motivational and demotivational messages',
      importance: Importance.high,
      priority: Priority.high,
    );

    const DarwinNotificationDetails iOSPlatformChannelSpecifics =
        DarwinNotificationDetails();

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: iOSPlatformChannelSpecifics,
      macOS: iOSPlatformChannelSpecifics,
    );

    await _flutterLocalNotificationsPlugin.zonedSchedule(
      id,
      'Demotivation',
      messageContent,
      tz.TZDateTime.from(scheduledTime, tz.local),
      platformChannelSpecifics,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
    );
  }

  static Future<void> cancelAllNotifications() async {
    if (kIsWeb) return;
    await _flutterLocalNotificationsPlugin.cancelAll();
  }
}