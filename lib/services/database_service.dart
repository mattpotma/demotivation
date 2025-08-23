import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/message.dart';
import '../models/schedule.dart';

class DatabaseService {
  static Database? _database;
  static const String _messagesTableName = 'messages';
  static const String _schedulesTableName = 'schedules';

  static Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB();
    return _database!;
  }

  static Future<Database> _initDB() async {
    String path = join(await getDatabasesPath(), 'demotivation.db');
    return await openDatabase(
      path,
      version: 2,
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
    );
  }

  static Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE $_messagesTableName (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        isMotivational INTEGER NOT NULL
      )
    ''');
    
    await db.execute('''
      CREATE TABLE $_schedulesTableName (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        frequency TEXT NOT NULL,
        hour INTEGER NOT NULL,
        minute INTEGER NOT NULL,
        motivationPercentage REAL NOT NULL,
        isEnabled INTEGER NOT NULL
      )
    ''');
  }

  static Future<void> _upgradeDB(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('''
        CREATE TABLE $_schedulesTableName (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          frequency TEXT NOT NULL,
          hour INTEGER NOT NULL,
          minute INTEGER NOT NULL,
          motivationPercentage REAL NOT NULL,
          isEnabled INTEGER NOT NULL
        )
      ''');
    }
  }

  static Future<void> insertMessage(Message message) async {
    final db = await database;
    await db.insert(_messagesTableName, message.toMap());
  }

  static Future<List<Message>> getAllMessages() async {
    final db = await database;
    final maps = await db.query(_messagesTableName);
    return maps.map((map) => Message.fromMap(map)).toList();
  }

  static Future<Message?> getRandomMessage(bool isMotivational) async {
    final db = await database;
    final maps = await db.query(
      _messagesTableName,
      where: 'isMotivational = ?',
      whereArgs: [isMotivational ? 1 : 0],
      orderBy: 'RANDOM()',
      limit: 1,
    );
    
    if (maps.isEmpty) return null;
    return Message.fromMap(maps.first);
  }

  static Future<void> clearMessages() async {
    final db = await database;
    await db.delete(_messagesTableName);
  }

  static Future<int> insertSchedule(Schedule schedule) async {
    final db = await database;
    return await db.insert(_schedulesTableName, schedule.toMap());
  }

  static Future<List<Schedule>> getAllSchedules() async {
    final db = await database;
    final maps = await db.query(_schedulesTableName, orderBy: 'name');
    return maps.map((map) => Schedule.fromMap(map)).toList();
  }

  static Future<void> updateSchedule(Schedule schedule) async {
    final db = await database;
    await db.update(
      _schedulesTableName,
      schedule.toMap(),
      where: 'id = ?',
      whereArgs: [schedule.id],
    );
  }

  static Future<void> deleteSchedule(int id) async {
    final db = await database;
    await db.delete(
      _schedulesTableName,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  static Future<List<Schedule>> getEnabledSchedules() async {
    final db = await database;
    final maps = await db.query(
      _schedulesTableName,
      where: 'isEnabled = ?',
      whereArgs: [1],
    );
    return maps.map((map) => Schedule.fromMap(map)).toList();
  }
}