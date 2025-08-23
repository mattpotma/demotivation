import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/message.dart';

class DatabaseService {
  static Database? _database;
  static const String _tableName = 'messages';

  static Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB();
    return _database!;
  }

  static Future<Database> _initDB() async {
    String path = join(await getDatabasesPath(), 'demotivation.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  static Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE $_tableName (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        isMotivational INTEGER NOT NULL
      )
    ''');
  }

  static Future<void> insertMessage(Message message) async {
    final db = await database;
    await db.insert(_tableName, message.toMap());
  }

  static Future<List<Message>> getAllMessages() async {
    final db = await database;
    final maps = await db.query(_tableName);
    return maps.map((map) => Message.fromMap(map)).toList();
  }

  static Future<Message?> getRandomMessage(bool isMotivational) async {
    final db = await database;
    final maps = await db.query(
      _tableName,
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
    await db.delete(_tableName);
  }
}