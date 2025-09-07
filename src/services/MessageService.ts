import SQLite from 'react-native-sqlite-storage';

export interface MessageFilters {
  motivational?: boolean;
  inspirational?: boolean;
  funny?: boolean;
  quote?: boolean;
  philosophical?: boolean;
  daily_affirmation?: boolean;
  harsh_truth?: boolean;
  workplace?: boolean;
  personal_growth?: boolean;
  existential?: boolean;
  complimentary?: boolean;
}

export class MessageService {
  private static db: SQLite.SQLiteDatabase | null = null;

  static async initDatabase(): Promise<void> {
    if (this.db) {
      return;
    }

    try {
      this.db = await SQLite.openDatabase({
        name: 'demotivation.db',
        location: 'default',
      });
    } catch (error) {
      console.error('Failed to open database:', error);
      throw error;
    }
  }

  static async getRandomMessage(isMotivational: boolean): Promise<string> {
    await this.initDatabase();

    if (!this.db) {
      return isMotivational ? 'Stay positive!' : "Life's meaningless anyway.";
    }

    try {
      // First, get all IDs that match the criteria
      const countQuery =
        'SELECT COUNT(*) as count FROM messages WHERE motivational = ?';
      const countResult = await this.db.executeSql(countQuery, [
        isMotivational ? 1 : 0,
      ]);
      const messageCount = countResult[0].rows.item(0).count;

      if (messageCount === 0) {
        return isMotivational ? 'Stay positive!' : "Life's meaningless anyway.";
      }

      // Generate a random offset
      const randomOffset = Math.floor(Math.random() * messageCount);

      // Get the message at that offset
      const messageQuery =
        'SELECT message FROM messages WHERE motivational = ? LIMIT 1 OFFSET ?';
      const messageResult = await this.db.executeSql(messageQuery, [
        isMotivational ? 1 : 0,
        randomOffset,
      ]);

      if (messageResult[0].rows.length > 0) {
        return messageResult[0].rows.item(0).message;
      } else {
        return isMotivational ? 'Stay positive!' : "Life's meaningless anyway.";
      }
    } catch (error) {
      console.error('Failed to get random message:', error);
      return isMotivational ? 'Stay positive!' : "Life's meaningless anyway.";
    }
  }

  static async getMessagesWithFilters(
    filters: MessageFilters,
  ): Promise<string[]> {
    await this.initDatabase();

    if (!this.db) {
      return [];
    }

    try {
      let query = 'SELECT message FROM messages';
      const params: any[] = [];
      const conditions: string[] = [];

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined) {
          conditions.push(`${key} = ?`);
          params.push(value ? 1 : 0);
        }
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      const result = await this.db.executeSql(query, params);
      const messages: string[] = [];

      for (let i = 0; i < result[0].rows.length; i++) {
        messages.push(result[0].rows.item(i).message);
      }

      return messages;
    } catch (error) {
      console.error('Failed to get filtered messages:', error);
      return [];
    }
  }

  static async getRandomMessageWithFilters(
    filters: MessageFilters,
  ): Promise<string> {
    await this.initDatabase();

    if (!this.db) {
      return 'No messages available.';
    }

    try {
      // Build count query
      let countQuery = 'SELECT COUNT(*) as count FROM messages';
      const params: any[] = [];
      const conditions: string[] = [];

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined) {
          conditions.push(`${key} = ?`);
          params.push(value ? 1 : 0);
        }
      }

      if (conditions.length > 0) {
        countQuery += ` WHERE ${conditions.join(' AND ')}`;
      }

      const countResult = await this.db.executeSql(countQuery, params);
      const messageCount = countResult[0].rows.item(0).count;

      if (messageCount === 0) {
        return 'No messages match your criteria.';
      }

      // Generate random offset
      const randomOffset = Math.floor(Math.random() * messageCount);

      // Get the message at that offset
      let messageQuery = 'SELECT message FROM messages';
      if (conditions.length > 0) {
        messageQuery += ` WHERE ${conditions.join(' AND ')}`;
      }
      messageQuery += ' LIMIT 1 OFFSET ?';

      const messageResult = await this.db.executeSql(messageQuery, [
        ...params,
        randomOffset,
      ]);

      if (messageResult[0].rows.length > 0) {
        return messageResult[0].rows.item(0).message;
      } else {
        return 'No messages available.';
      }
    } catch (error) {
      console.error('Failed to get random filtered message:', error);
      return 'Error retrieving message.';
    }
  }

  static async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}
