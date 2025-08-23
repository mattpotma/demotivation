import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  if (!kIsWeb) {
    await NotificationService.initialize();
  }
  
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
  double _motivationPercentage = 50.0;
  TimeOfDay _dailyTime = const TimeOfDay(hour: 9, minute: 0);
  String _frequency = 'Daily';
  bool _notificationsEnabled = false;

  final List<String> _frequencies = ['Daily', 'Weekly', 'Hourly'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('I Am Not'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Notification Schedule',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Text('Frequency: '),
                        DropdownButton<String>(
                          value: _frequency,
                          onChanged: (String? newValue) {
                            if (newValue != null) {
                              setState(() {
                                _frequency = newValue;
                              });
                            }
                          },
                          items: _frequencies.map<DropdownMenuItem<String>>((String value) {
                            return DropdownMenuItem<String>(
                              value: value,
                              child: Text(value),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Text('Time: '),
                        TextButton(
                          onPressed: () async {
                            final TimeOfDay? picked = await showTimePicker(
                              context: context,
                              initialTime: _dailyTime,
                            );
                            if (picked != null && picked != _dailyTime) {
                              setState(() {
                                _dailyTime = picked;
                              });
                            }
                          },
                          child: Text(_dailyTime.format(context)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Message Type Balance',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 16),
                    Text('Motivational: ${_motivationPercentage.round()}%'),
                    Text('Demotivational: ${(100 - _motivationPercentage).round()}%'),
                    const SizedBox(height: 8),
                    Slider(
                      value: _motivationPercentage,
                      min: 0,
                      max: 100,
                      divisions: 10,
                      onChanged: (double value) {
                        setState(() {
                          _motivationPercentage = value;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _notificationsEnabled ? _disableNotifications : _enableNotifications,
              style: ElevatedButton.styleFrom(
                backgroundColor: _notificationsEnabled ? Colors.red : Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text(
                _notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications',
                style: const TextStyle(fontSize: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _enableNotifications() async {
    if (kIsWeb) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notifications not supported on web. Use mobile app.')),
        );
      }
      return;
    }
    
    bool hasPermission = await NotificationService.requestPermissions();
    if (hasPermission) {
      await NotificationService.scheduleNotifications(
        frequency: _frequency,
        time: _dailyTime,
        motivationPercentage: _motivationPercentage,
      );
      setState(() {
        _notificationsEnabled = true;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notifications enabled!')),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Permission denied. Enable notifications in settings.')),
        );
      }
    }
  }

  Future<void> _disableNotifications() async {
    await NotificationService.cancelAllNotifications();
    setState(() {
      _notificationsEnabled = false;
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Notifications disabled!')),
      );
    }
  }
}
