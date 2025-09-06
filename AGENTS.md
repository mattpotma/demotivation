# React Native Demotivation App - Current Status

## Project Overview

This is a React Native 0.74.5 demotivation app that sends scheduled motivational/demotivational messages. The project has been successfully moved from a nested structure and is now running in the root directory `/home/matt/src/demotivation/`.

## Project Structure

```
/home/matt/src/demotivation/
├── src/
│   ├── components/
│   │   ├── ScheduleCard.tsx - UI component for displaying schedule cards with edit/delete actions
│   │   └── ScheduleForm.tsx - Modal form for creating/editing schedules with time picker
│   ├── services/
│   │   ├── MessageService.ts - Manages arrays of motivational/demotivational messages
│   │   └── NotificationService.ts - Handles Notifee-based local notifications
│   └── types/
│       └── Schedule.ts - TypeScript interface for Schedule objects
├── App.tsx - Main app component with full CRUD operations and AsyncStorage
├── android/ - Android configuration and build files
├── package.json - Project dependencies and scripts
└── DEMOTIVATION.md - Original project specifications
```

## Current Dependencies

- `@react-native-async-storage/async-storage` - Local persistence for schedules
- `@notifee/react-native` - Local push notifications (Firebase-free)
- `@react-native-community/datetimepicker` - Time picker component
- React Native 0.74.5 framework

## Build Environment

- **JAVA_HOME**: `/usr/lib/jvm/java-17-openjdk-amd64` (JDK 17 required)
- **Android SDK**: `/home/matt/Android/Sdk`
- **Debug Build**: `cd android && export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 && ./gradlew assembleDebug`
- **Release Build**: `cd android && export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 && ./gradlew assembleRelease`

## Android Configuration

- **Manifest**: `android/app/src/main/AndroidManifest.xml`
- **Required Permissions**: `POST_NOTIFICATIONS` only (minimal permissions approach)
- **Notification System**: Uses Notifee for system tray notifications
- **APK Locations**:
  - Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
  - Release: `android/app/build/outputs/apk/release/app-release.apk`

## App Features

- **Schedule Management**: Full CRUD operations (Create, Read, Update, Delete, Toggle)
- **Notification Frequencies**: Hourly, Daily, Weekly options
- **Message Control**: Configurable motivation percentage (0-100%) per schedule
- **Default Naming**: Auto-generates schedule names based on frequency selection
- **UI Fixes**: Text inputs have proper visibility with `color: '#333'`
- **Real Notifications**: System tray notifications that persist after app closure

## Technical Implementation

- **Notification Scheduling**: Uses `setTimeout` for inexact alarms (no special permissions)
- **Data Persistence**: AsyncStorage with JSON serialization
- **UI Framework**: Vanilla React Native components (no external UI library)
- **Permission Handling**: Request POST_NOTIFICATIONS permission on first use
- **Background Operation**: Release APK runs independently without Metro bundler

## Device Installation Status

- **Target Device**: Pixel 7 (connected via ADB)
- **Current Status**: Release APK installed and working
- **Installation Command**: `adb install ./android/app/build/outputs/apk/release/app-release.apk`

## Git Status

- **Repository**: Clean git structure with appropriate .gitignore
- **Staged Files**: All source code, configuration, and dependencies staged for commit
- **Ignored Files**: Build outputs (\*.apk), node_modules, Android build directories
- **Ready for Commit**: Yes, all development files are staged

## Known Working Features

✅ Schedule creation with time picker
✅ Motivation percentage slider (0-100%)
✅ Real push notifications in system tray
✅ Schedule editing and deletion
✅ Enable/disable toggle for schedules
✅ Automatic default naming based on frequency
✅ Standalone APK operation (no Metro required)
✅ Proper text input visibility
✅ AsyncStorage persistence across app restarts

## Migration Notes

- Successfully moved from nested `./Demotivation/` directory structure
- Removed Firebase dependencies (switched from react-native-push-notification to @notifee/react-native)
- Fixed exact alarm permission issues by using inexact scheduling
- All builds now work from root directory `/home/matt/src/demotivation/`
