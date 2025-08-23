import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;
import 'dart:math';
import 'message_service.dart';
import 'database_service.dart';
import '../models/schedule.dart';

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

  static Future<void> scheduleAllEnabledNotifications() async {
    if (kIsWeb) return;
    
    await cancelAllNotifications();
    
    final enabledSchedules = await DatabaseService.getEnabledSchedules();
    
    for (int scheduleIndex = 0; scheduleIndex < enabledSchedules.length; scheduleIndex++) {
      final schedule = enabledSchedules[scheduleIndex];
      await _scheduleNotificationsForSchedule(schedule, scheduleIndex * 1000);
    }
  }

  static Future<void> _scheduleNotificationsForSchedule(Schedule schedule, int baseId) async {
    final now = DateTime.now();
    
    switch (schedule.frequency) {
      case 'Hourly':
        await _scheduleHourlyNotifications(schedule.motivationPercentage, baseId, schedule.time.minute);
        break;
      case 'Daily':
        DateTime scheduledTime = DateTime(now.year, now.month, now.day, schedule.time.hour, schedule.time.minute);
        if (scheduledTime.isBefore(now)) {
          scheduledTime = scheduledTime.add(const Duration(days: 1));
        }
        await _scheduleDailyNotifications(scheduledTime, schedule.motivationPercentage, baseId);
        break;
      case 'Weekly':
        DateTime scheduledTime = DateTime(now.year, now.month, now.day, schedule.time.hour, schedule.time.minute);
        if (scheduledTime.isBefore(now)) {
          scheduledTime = scheduledTime.add(const Duration(days: 1));
        }
        await _scheduleWeeklyNotifications(scheduledTime, schedule.motivationPercentage, baseId);
        break;
    }
  }

  static Future<void> _scheduleHourlyNotifications(double motivationPercentage, int baseId, int minutesPastHour) async {
    final now = DateTime.now();
    
    for (int i = 0; i < 24; i++) {
      DateTime scheduledTime = DateTime(now.year, now.month, now.day, now.hour + i + 1, minutesPastHour);
      
      if (scheduledTime.isBefore(now)) {
        scheduledTime = scheduledTime.add(const Duration(days: 1));
      }

      await _scheduleNotification(baseId + i, scheduledTime, motivationPercentage);
    }
  }

  static Future<void> _scheduleDailyNotifications(DateTime initialTime, double motivationPercentage, int baseId) async {
    for (int i = 0; i < 7; i++) {
      final scheduledTime = initialTime.add(Duration(days: i));
      await _scheduleNotification(baseId + i, scheduledTime, motivationPercentage);
    }
  }

  static Future<void> _scheduleWeeklyNotifications(DateTime initialTime, double motivationPercentage, int baseId) async {
    for (int i = 0; i < 4; i++) {
      final scheduledTime = initialTime.add(Duration(days: i * 7));
      await _scheduleNotification(baseId + i, scheduledTime, motivationPercentage);
    }
  }

  static Future<void> _scheduleNotification(int id, DateTime scheduledTime, double motivationPercentage) async {
    try {
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

      final tz.TZDateTime scheduledDate = tz.TZDateTime.from(scheduledTime, tz.local);

      await _flutterLocalNotificationsPlugin.zonedSchedule(
        id,
        'Demotivation',
        messageContent,
        scheduledDate,
        platformChannelSpecifics,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
    } catch (e) {
      print('Error scheduling notification $id: $e');
    }
  }

  static Future<void> cancelAllNotifications() async {
    if (kIsWeb) return;
    await _flutterLocalNotificationsPlugin.cancelAll();
  }
}