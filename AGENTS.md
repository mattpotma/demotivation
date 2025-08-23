# Demotivation

A simple cross-platform Flutter application that sends periodic messages to users - sometimes positive, sometimes negative. The app uses local notifications and scheduling to deliver messages at configured intervals.

## Features

- Cross-platform support (iOS, Android, Web, Desktop)
- Local message database with SQLite
- Scheduled notifications using cron scheduling
- Mixed positive and negative message delivery
- Local notification system

## Architecture

- **Models**: Message data structures
- **Services**: Database, message seeding, message delivery, and notification management
- **Dependencies**: Uses sqflite for local storage, flutter_local_notifications for notifications, and cron for scheduling