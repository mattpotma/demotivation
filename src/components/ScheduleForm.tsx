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
  const [name, setName] = useState(initialData?.name || 'Weekly Messages');
  const [daysOfWeek, setDaysOfWeek] = useState<boolean[]>(() => {
    // Handle backward compatibility with old frequency format
    if (initialData?.frequency) {
      switch (initialData.frequency) {
        case 'Daily':
          return [true, true, true, true, true, true, true];
        case 'Weekly':
          return [false, false, false, false, false, false, false];
        case 'Hourly':
          return [true, true, true, true, true, true, true];
        default:
          return [false, false, false, false, false, false, false];
      }
    }
    
    return initialData?.daysOfWeek || [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    if (initialData) {
      now.setHours(initialData.hour, initialData.minute, 0, 0);
    }
    return now;
  });
  const [motivationPercentage, setMotivationPercentage] = useState(
    initialData?.motivationPercentage || 50,
  );

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (dayIndex: number) => {
    const newDaysOfWeek = [...daysOfWeek];
    newDaysOfWeek[dayIndex] = !newDaysOfWeek[dayIndex];
    setDaysOfWeek(newDaysOfWeek);
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

    const motivation = Math.max(
      0,
      Math.min(100, Math.round(motivationPercentage)),
    );

    const schedule: Omit<Schedule, 'id'> = {
      name: name.trim(),
      daysOfWeek,
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
        <Text style={styles.label}>Days of Week</Text>
        <View style={styles.daysContainer}>
          {dayNames.map((dayName, index) => (
            <TouchableOpacity
              key={dayName}
              style={[
                styles.dayButton,
                daysOfWeek[index] && styles.dayButtonActive,
              ]}
              onPress={() => toggleDay(index)}>
              <Text
                style={[
                  styles.dayButtonText,
                  daysOfWeek[index] && styles.dayButtonTextActive,
                ]}>
                {dayName}
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
          Motivational Percentage: {Math.round(motivationPercentage)}%
        </Text>
        <View style={styles.percentageSelector}>
          <Text style={styles.testLabel}>Tap to set percentage:</Text>
          <View style={styles.percentageButtons}>
            {[0, 25, 50, 75, 100].map((percent) => (
              <TouchableOpacity
                key={percent}
                style={[
                  styles.percentButton,
                  motivationPercentage === percent && styles.percentButtonActive
                ]}
                onPress={() => setMotivationPercentage(percent)}>
                <Text style={[
                  styles.percentButtonText,
                  motivationPercentage === percent && styles.percentButtonTextActive
                ]}>
                  {percent}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.testLabel}>Current: {Math.round(motivationPercentage)}%</Text>
        </View>
        <Text style={styles.helperText}>
          {Math.round(motivationPercentage)}% motivational,{' '}
          {100 - Math.round(motivationPercentage)}% demotivational
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
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 44,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  dayButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: 'white',
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
  sliderTestContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  testLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  percentageSelector: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  percentageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  percentButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    minWidth: 50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  percentButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  percentButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  percentButtonTextActive: {
    color: 'white',
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
