import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Schedule} from './src/types/Schedule';
import {NotificationService} from './src/services/NotificationService';
import {ScheduleCard} from './src/components/ScheduleCard';
import {ScheduleForm} from './src/components/ScheduleForm';

const SCHEDULES_STORAGE_KEY = 'demotivation_schedules';

function App(): React.JSX.Element {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<
    Schedule | undefined
  >();
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(
    null,
  );
  const [debugNotifications, setDebugNotifications] = useState<any[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    const scheduleNotifications = async () => {
      if (permissionsGranted && schedules.length > 0) {
        await NotificationService.scheduleAllEnabledNotifications(schedules);
      }
    };
    scheduleNotifications();
  }, [schedules, permissionsGranted]);

  const initializeApp = async () => {
    NotificationService.initialize();
    await loadSchedules();
  };

  const loadSchedules = async () => {
    try {
      const storedSchedules = await AsyncStorage.getItem(SCHEDULES_STORAGE_KEY);
      if (storedSchedules) {
        setSchedules(JSON.parse(storedSchedules));
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const saveSchedules = async (newSchedules: Schedule[]) => {
    try {
      await AsyncStorage.setItem(
        SCHEDULES_STORAGE_KEY,
        JSON.stringify(newSchedules),
      );
      setSchedules(newSchedules);
    } catch (error) {
      console.error('Error saving schedules:', error);
    }
  };

  const requestPermissionsIfNeeded = async () => {
    const granted = await NotificationService.requestPermissions();
    setPermissionsGranted(granted);
    if (!granted) {
      Alert.alert(
        'Notification Permission Required',
        'This app needs notification permission to send you scheduled messages. Please grant permission in the next dialog.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'OK',
            onPress: async () => {
              const retryGranted =
                await NotificationService.requestPermissions();
              setPermissionsGranted(retryGranted);
            },
          },
        ],
      );
    }
    return granted;
  };

  const handleAddSchedule = () => {
    setEditingSchedule(undefined);
    setShowForm(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleSaveSchedule = async (scheduleData: Omit<Schedule, 'id'>) => {
    const hasPermissions = await requestPermissionsIfNeeded();
    if (!hasPermissions) {
      return;
    }

    let newSchedules: Schedule[];

    if (editingSchedule) {
      newSchedules = schedules.map(s =>
        s.id === editingSchedule.id
          ? {...scheduleData, id: editingSchedule.id}
          : s,
      );
    } else {
      const newId = Math.max(0, ...schedules.map(s => s.id || 0)) + 1;
      const newSchedule: Schedule = {...scheduleData, id: newId};
      newSchedules = [...schedules, newSchedule];
    }

    await saveSchedules(newSchedules);
    setShowForm(false);
    setEditingSchedule(undefined);
  };

  const handleToggleSchedule = async (id: number) => {
    const newSchedules = schedules.map(schedule =>
      schedule.id === id
        ? {...schedule, isEnabled: !schedule.isEnabled}
        : schedule,
    );
    await saveSchedules(newSchedules);
  };

  const handleDeleteSchedule = (id: number) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const newSchedules = schedules.filter(s => s.id !== id);
            await saveSchedules(newSchedules);
          },
        },
      ],
    );
  };

  const handleShowDebug = async () => {
    const notificationData =
      await NotificationService.getScheduledNotifications();
    const logs = NotificationService.getLogs();
    setDebugNotifications(notificationData.trigger);
    setDebugLogs(logs);
    setShowDebug(true);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Schedules Yet</Text>
      <Text style={styles.emptyText}>
        Create your first schedule to start receiving motivational and
        demotivational notifications.
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddSchedule}>
        <Text style={styles.addButtonText}>Create Schedule</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSchedulesList = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Demotivation</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={handleShowDebug}>
            <Text style={styles.debugButtonText}>Debug</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddSchedule}>
            <Text style={styles.addButtonText}>Add Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {schedules.map(schedule => (
          <ScheduleCard
            key={schedule.id}
            schedule={schedule}
            onToggle={() => handleToggleSchedule(schedule.id!)}
            onEdit={() => handleEditSchedule(schedule)}
            onDelete={() => handleDeleteSchedule(schedule.id!)}
          />
        ))}
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {schedules.length === 0 ? renderEmptyState() : renderSchedulesList()}

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <ScheduleForm
            initialData={editingSchedule}
            onSave={handleSaveSchedule}
            onCancel={() => {
              setShowForm(false);
              setEditingSchedule(undefined);
            }}
          />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showDebug}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.debugContainer}>
            <View style={styles.debugHeader}>
              <Text style={styles.debugTitle}>Debug Info</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDebug(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.debugScroll}>
              <Text style={styles.debugSectionTitle}>
                Scheduled Notifications ({debugNotifications.length})
              </Text>
              {debugNotifications.length === 0 ? (
                <Text style={styles.noNotificationsText}>
                  No notifications scheduled
                </Text>
              ) : (
                debugNotifications.map((notification, index) => {
                  const trigger = notification.trigger as any;
                  const timestamp = trigger?.timestamp;
                  const date = timestamp ? new Date(timestamp) : null;
                  return (
                    <View key={index} style={styles.debugNotification}>
                      <Text style={styles.debugNotificationId}>
                        ID: {notification.notification.id}
                      </Text>
                      <Text style={styles.debugNotificationTitle}>
                        {notification.notification.title}
                      </Text>
                      <Text style={styles.debugNotificationBody}>
                        {notification.notification.body}
                      </Text>
                      <Text style={styles.debugNotificationTime}>
                        {date ? date.toLocaleString() : 'Unknown time'}
                      </Text>
                      <Text style={styles.debugNotificationDelay}>
                        {date
                          ? `In ${Math.round(
                              (date.getTime() - Date.now()) / 1000,
                            )}s`
                          : ''}
                      </Text>
                    </View>
                  );
                })
              )}

              <Text style={styles.debugSectionTitle}>
                Recent Logs ({debugLogs.length})
              </Text>
              {debugLogs.length === 0 ? (
                <Text style={styles.noLogsText}>No logs available</Text>
              ) : (
                debugLogs
                  .slice(-20)
                  .reverse()
                  .map((log, index) => (
                    <View key={index} style={styles.debugLogEntry}>
                      <Text style={styles.debugLogText}>{log}</Text>
                    </View>
                  ))
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  modal: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  debugButton: {
    backgroundColor: '#666',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  debugButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  debugContainer: {
    flex: 1,
    padding: 20,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  debugScroll: {
    flex: 1,
  },
  noNotificationsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
  },
  debugSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  noLogsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  debugLogEntry: {
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#999',
  },
  debugLogText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  debugNotification: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  debugNotificationId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  debugNotificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  debugNotificationBody: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  debugNotificationTime: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 2,
  },
  debugNotificationDelay: {
    fontSize: 12,
    color: '#999',
  },
});

export default App;
