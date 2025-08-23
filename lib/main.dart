import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'services/notification_service.dart';
import 'services/database_service.dart';
import 'services/message_seeder.dart';
import 'models/schedule.dart';
import 'widgets/schedule_card.dart';
import 'widgets/schedule_form.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  if (!kIsWeb) {
    await NotificationService.initialize();
  }
  
  await MessageSeeder.seedDatabase();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'I Am Not',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<Schedule> _schedules = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSchedules();
  }

  Future<void> _loadSchedules() async {
    try {
      final schedules = await DatabaseService.getAllSchedules();
      setState(() {
        _schedules = schedules;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('I Am Not'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _addNewSchedule,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _schedules.isEmpty
              ? _buildEmptyState()
              : _buildScheduleList(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.schedule,
            size: 64,
            color: Theme.of(context).colorScheme.secondary,
          ),
          const SizedBox(height: 16),
          Text(
            'No schedules yet',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          const Text('Add your first notification schedule'),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _addNewSchedule,
            icon: const Icon(Icons.add),
            label: const Text('Add Schedule'),
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleList() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _schedules.length,
              itemBuilder: (context, index) {
                final schedule = _schedules[index];
                return ScheduleCard(
                  schedule: schedule,
                  onToggle: () => _toggleSchedule(schedule),
                  onEdit: () => _editSchedule(schedule),
                  onDelete: () => _deleteSchedule(schedule),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _addNewSchedule,
            icon: const Icon(Icons.add),
            label: const Text('Add New Schedule'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ],
      ),
    );
  }

  void _addNewSchedule() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ScheduleForm(
          onSave: _saveSchedule,
        ),
      ),
    );
  }

  void _editSchedule(Schedule schedule) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ScheduleForm(
          initialSchedule: schedule,
          onSave: _saveSchedule,
        ),
      ),
    );
  }

  Future<void> _saveSchedule(Schedule schedule) async {
    try {
      if (schedule.id == null) {
        await DatabaseService.insertSchedule(schedule);
      } else {
        await DatabaseService.updateSchedule(schedule);
      }
      await _loadSchedules();
      await _updateNotifications();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Schedule saved!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving schedule: $e')),
        );
      }
    }
  }

  Future<void> _toggleSchedule(Schedule schedule) async {
    try {
      final updatedSchedule = schedule.copyWith(isEnabled: !schedule.isEnabled);
      await DatabaseService.updateSchedule(updatedSchedule);
      await _loadSchedules();
      await _updateNotifications();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating schedule: $e')),
        );
      }
    }
  }

  Future<void> _deleteSchedule(Schedule schedule) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Schedule'),
        content: Text('Are you sure you want to delete "${schedule.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && schedule.id != null) {
      try {
        await DatabaseService.deleteSchedule(schedule.id!);
        await _loadSchedules();
        await _updateNotifications();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Schedule deleted!')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting schedule: $e')),
          );
        }
      }
    }
  }

  Future<void> _updateNotifications() async {
    if (kIsWeb) return;
    
    bool hasPermission = await NotificationService.requestPermissions();
    if (hasPermission) {
      await NotificationService.scheduleAllEnabledNotifications();
    }
  }
}
