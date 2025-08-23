import 'package:flutter/material.dart';
import '../models/schedule.dart';

class ScheduleForm extends StatefulWidget {
  final Schedule? initialSchedule;
  final Function(Schedule) onSave;

  const ScheduleForm({
    super.key,
    this.initialSchedule,
    required this.onSave,
  });

  @override
  State<ScheduleForm> createState() => _ScheduleFormState();
}

class _ScheduleFormState extends State<ScheduleForm> {
  late TextEditingController _nameController;
  late String _frequency;
  late TimeOfDay _time;
  late double _motivationPercentage;
  late bool _isEnabled;

  final List<String> _frequencies = ['Daily', 'Weekly', 'Hourly'];

  @override
  void initState() {
    super.initState();
    final schedule = widget.initialSchedule;
    _nameController = TextEditingController(text: schedule?.name ?? '');
    _frequency = schedule?.frequency ?? 'Daily';
    _time = schedule?.time ?? const TimeOfDay(hour: 9, minute: 0);
    _motivationPercentage = schedule?.motivationPercentage ?? 50.0;
    _isEnabled = schedule?.isEnabled ?? true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.initialSchedule == null ? 'New Schedule' : 'Edit Schedule'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          TextButton(
            onPressed: _saveSchedule,
            child: const Text('Save'),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: 'Schedule Name (optional)',
                hintText: 'Leave empty to use: $_frequency',
                border: const OutlineInputBorder(),
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
                      'Schedule Settings',
                      style: Theme.of(context).textTheme.titleMedium,
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
                        Text(_frequency == 'Hourly' ? 'Minutes past hour: ' : 'Time: '),
                        TextButton(
                          onPressed: () async {
                            if (_frequency == 'Hourly') {
                              final int? picked = await showDialog<int>(
                                context: context,
                                builder: (context) => _MinutePickerDialog(initialMinute: _time.minute),
                              );
                              if (picked != null && picked != _time.minute) {
                                setState(() {
                                  _time = TimeOfDay(hour: 0, minute: picked);
                                });
                              }
                            } else {
                              final TimeOfDay? picked = await showTimePicker(
                                context: context,
                                initialTime: _time,
                              );
                              if (picked != null && picked != _time) {
                                setState(() {
                                  _time = picked;
                                });
                              }
                            }
                          },
                          child: Text(_frequency == 'Hourly' 
                              ? '${_time.minute} minutes' 
                              : _time.format(context)),
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
                      style: Theme.of(context).textTheme.titleMedium,
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
            const SizedBox(height: 16),
            Row(
              children: [
                Checkbox(
                  value: _isEnabled,
                  onChanged: (bool? value) {
                    setState(() {
                      _isEnabled = value ?? false;
                    });
                  },
                ),
                const Text('Enable this schedule'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _saveSchedule() {
    final name = _nameController.text.trim().isEmpty 
        ? _frequency 
        : _nameController.text.trim();

    final schedule = Schedule(
      id: widget.initialSchedule?.id,
      name: name,
      frequency: _frequency,
      time: _time,
      motivationPercentage: _motivationPercentage,
      isEnabled: _isEnabled,
    );

    widget.onSave(schedule);
    Navigator.of(context).pop();
  }
}

class _MinutePickerDialog extends StatefulWidget {
  final int initialMinute;

  const _MinutePickerDialog({required this.initialMinute});

  @override
  State<_MinutePickerDialog> createState() => _MinutePickerDialogState();
}

class _MinutePickerDialogState extends State<_MinutePickerDialog> {
  late int _selectedMinute;

  @override
  void initState() {
    super.initState();
    _selectedMinute = widget.initialMinute;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Minutes past hour'),
      content: SizedBox(
        width: 200,
        height: 200,
        child: ListWheelScrollView.useDelegate(
          itemExtent: 40,
          onSelectedItemChanged: (index) {
            setState(() {
              _selectedMinute = index;
            });
          },
          controller: FixedExtentScrollController(initialItem: _selectedMinute),
          childDelegate: ListWheelChildBuilderDelegate(
            builder: (context, index) {
              if (index < 0 || index >= 60) return null;
              return Center(
                child: Text(
                  '$index',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: index == _selectedMinute ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              );
            },
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(_selectedMinute),
          child: const Text('OK'),
        ),
      ],
    );
  }
}