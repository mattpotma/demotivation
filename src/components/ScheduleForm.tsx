import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Schedule} from '../types/Schedule';

interface ScheduleFormProps {
  initialData?: Schedule;
  onSave: (schedule: Omit<Schedule, 'id'>) => void;
  onCancel: () => void;
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(initialData?.name || 'Daily Messages');
  const [frequency, setFrequency] = useState<Schedule['frequency']>(
    initialData?.frequency || 'Daily'
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    if (initialData) {
      now.setHours(initialData.hour, initialData.minute, 0, 0);
    }
    return now;
  });
  const [motivationPercentage, setMotivationPercentage] = useState(
    initialData?.motivationPercentage?.toString() || '50'
  );

  const frequencies: Schedule['frequency'][] = ['Hourly', 'Daily', 'Weekly'];

  const handleFrequencyChange = (newFrequency: Schedule['frequency']) => {
    setFrequency(newFrequency);
    // Update default name if user hasn't customized it
    const currentDefaultName = `${frequency} Messages`;
    if (name === currentDefaultName || name === '') {
      setName(`${newFrequency} Messages`);
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedTime(selectedDate);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    const motivation = Math.max(0, Math.min(100, parseInt(motivationPercentage) || 0));

    const schedule: Omit<Schedule, 'id'> = {
      name: name.trim(),
      frequency,
      hour: selectedTime.getHours(),
      minute: selectedTime.getMinutes(),
      motivationPercentage: motivation,
      isEnabled: initialData?.isEnabled ?? true,
    };

    onSave(schedule);
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {initialData ? 'Edit Schedule' : 'New Schedule'}
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Enter schedule name"
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Frequency</Text>
        <View style={styles.frequencyContainer}>
          {frequencies.map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyButton,
                frequency === freq && styles.frequencyButtonActive,
              ]}
              onPress={() => handleFrequencyChange(freq)}>
              <Text
                style={[
                  styles.frequencyButtonText,
                  frequency === freq && styles.frequencyButtonTextActive,
                ]}>
                {freq}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Time</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowTimePicker(true)}>
          <Text style={styles.timeButtonText}>{formatTime(selectedTime)}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Motivational Percentage (0-100%)
        </Text>
        <TextInput
          style={styles.textInput}
          value={motivationPercentage}
          onChangeText={setMotivationPercentage}
          placeholder="50"
          keyboardType="numeric"
          maxLength={3}
        />
        <Text style={styles.helperText}>
          {motivationPercentage}% motivational, {100 - parseInt(motivationPercentage || '0')}% demotivational
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!name.trim()}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  frequencyButtonText: {
    fontSize: 14,
    color: '#333',
  },
  frequencyButtonTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  timeButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});