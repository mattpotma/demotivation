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
        createFromLocation: 1, // This tells SQLite to copy from assets
      });

      // Verify the database has content
      const result = await this.db.executeSql('SELECT COUNT(*) as count FROM messages');
      const messageCount = result[0].rows.item(0).count;
      console.log(`Database initialized with ${messageCount} messages`);

      if (messageCount === 0) {
        console.warn('Database is empty - this suggests the asset copy failed');
      }
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
      // First, get all primary keys that match the criteria
      const idsQuery = 'SELECT id FROM messages WHERE motivational = ?';
      const idsResult = await this.db.executeSql(idsQuery, [
        isMotivational ? 1 : 0,
      ]);

      console.log(`Found ${idsResult[0].rows.length} ${isMotivational ? 'motivational' : 'demotivational'} messages`);

      if (idsResult[0].rows.length === 0) {
        console.warn(`No ${isMotivational ? 'motivational' : 'demotivational'} messages found`);
        return isMotivational ? 'Stay positive!' : "Life's meaningless anyway.";
      }

      // Collect all IDs
      const messageIds: number[] = [];
      for (let i = 0; i < idsResult[0].rows.length; i++) {
        messageIds.push(idsResult[0].rows.item(i).id);
      }

      // Randomly select one ID
      const randomIndex = Math.floor(Math.random() * messageIds.length);
      const selectedId = messageIds[randomIndex];
      
      console.log(`Available IDs: [${messageIds.join(', ')}]`);
      console.log(`Randomly selected ID: ${selectedId} (index ${randomIndex} of ${messageIds.length})`);

      // Get the message for that ID
      const messageQuery = 'SELECT message FROM messages WHERE id = ?';
      const messageResult = await this.db.executeSql(messageQuery, [selectedId]);

      if (messageResult[0].rows.length > 0) {
        const selectedMessage = messageResult[0].rows.item(0).message;
        console.log(`Selected message: "${selectedMessage}"`);
        return selectedMessage;
      } else {
        console.warn(`No message found for ID ${selectedId}`);
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
      // Build ID query
      let idsQuery = 'SELECT id FROM messages';
      const params: any[] = [];
      const conditions: string[] = [];

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined) {
          conditions.push(`${key} = ?`);
          params.push(value ? 1 : 0);
        }
      }

      if (conditions.length > 0) {
        idsQuery += ` WHERE ${conditions.join(' AND ')}`;
      }

      const idsResult = await this.db.executeSql(idsQuery, params);

      if (idsResult[0].rows.length === 0) {
        return 'No messages match your criteria.';
      }

      // Collect all IDs
      const messageIds: number[] = [];
      for (let i = 0; i < idsResult[0].rows.length; i++) {
        messageIds.push(idsResult[0].rows.item(i).id);
      }

      // Randomly select one ID
      const randomIndex = Math.floor(Math.random() * messageIds.length);
      const selectedId = messageIds[randomIndex];

      // Get the message for that ID
      const messageQuery = 'SELECT message FROM messages WHERE id = ?';
      const messageResult = await this.db.executeSql(messageQuery, [selectedId]);

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
