import 'package:flutter/material.dart';

class Schedule {
  final int? id;
  final String name;
  final String frequency;
  final TimeOfDay time;
  final double motivationPercentage;
  final bool isEnabled;

  Schedule({
    this.id,
    required this.name,
    required this.frequency,
    required this.time,
    required this.motivationPercentage,
    required this.isEnabled,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'frequency': frequency,
      'hour': time.hour,
      'minute': time.minute,
      'motivationPercentage': motivationPercentage,
      'isEnabled': isEnabled ? 1 : 0,
    };
  }

  factory Schedule.fromMap(Map<String, dynamic> map) {
    return Schedule(
      id: map['id'],
      name: map['name'],
      frequency: map['frequency'],
      time: TimeOfDay(hour: map['hour'], minute: map['minute']),
      motivationPercentage: map['motivationPercentage'],
      isEnabled: map['isEnabled'] == 1,
    );
  }

  Schedule copyWith({
    int? id,
    String? name,
    String? frequency,
    TimeOfDay? time,
    double? motivationPercentage,
    bool? isEnabled,
  }) {
    return Schedule(
      id: id ?? this.id,
      name: name ?? this.name,
      frequency: frequency ?? this.frequency,
      time: time ?? this.time,
      motivationPercentage: motivationPercentage ?? this.motivationPercentage,
      isEnabled: isEnabled ?? this.isEnabled,
    );
  }
}