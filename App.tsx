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

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (permissionsGranted && schedules.length > 0) {
      NotificationService.scheduleAllEnabledNotifications(schedules);
    }
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
        <TouchableOpacity style={styles.addButton} onPress={handleAddSchedule}>
          <Text style={styles.addButtonText}>Add Schedule</Text>
        </TouchableOpacity>
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
});

export default App;
