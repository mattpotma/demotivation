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

  const formatDays = (schedule: any) => {
    // Handle backward compatibility with old frequency format
    if (schedule.frequency) {
      return schedule.frequency;
    }
    
    // Handle new daysOfWeek format
    if (!schedule.daysOfWeek || !Array.isArray(schedule.daysOfWeek)) {
      return 'Never';
    }
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const selectedDays = dayNames.filter((_, index) => schedule.daysOfWeek[index]);

    if (selectedDays.length === 7) return 'Daily';
    if (selectedDays.length === 0) return 'Never';
    return selectedDays.join(', ');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{schedule.name}</Text>
        <Switch value={schedule.isEnabled} onValueChange={onToggle} />
      </View>

      <Text style={styles.frequency}>
        {formatDays(schedule)} at{' '}
        {formatTime(schedule.hour, schedule.minute)}
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
