import SQLite from 'react-native-sqlite-2';

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

export interface Message {
  id: number;
  message: string;
  motivational: number;
  inspirational?: number;
  funny?: number;
  quote?: number;
  philosophical?: number;
  daily_affirmation?: number;
  harsh_truth?: number;
  workplace?: number;
  personal_growth?: number;
  existential?: number;
  complimentary?: number;
}

export class MessageService {
  private static db: SQLite.Database | null = null;

  static async initDatabase(): Promise<void> {
    if (this.db) {
      return;
    }

    try {
      // Try to open from assets first, fallback to empty database
      try {
        this.db = SQLite.openDatabase({
          name: 'demotivation.db',
          createFromLocation: '~demotivation.db',
        });
      } catch (e) {
        this.db = SQLite.openDatabase({
          name: 'demotivation.db',
        });
      }

      // Ensure messages table exists and is populated
      await new Promise<void>((resolve) => {
        this.db!.transaction((tx: any) => {
          tx.executeSql(
            'SELECT COUNT(*) as count FROM messages',
            [],
            (tx: any, results: any) => {
              resolve();
            },
            (tx: any, error: any) => {
              this.createAndPopulateDatabase().then(() => resolve()).catch(() => resolve());
            }
          );
        });
      });
      
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  static async createAndPopulateDatabase(): Promise<void> {
    if (!this.db) return;

    return new Promise<void>((resolve, reject) => {
      this.db!.transaction((tx: any) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            motivational INTEGER NOT NULL,
            inspirational INTEGER DEFAULT 0,
            funny INTEGER DEFAULT 0,
            quote INTEGER DEFAULT 0,
            philosophical INTEGER DEFAULT 0,
            daily_affirmation INTEGER DEFAULT 0,
            harsh_truth INTEGER DEFAULT 0,
            workplace INTEGER DEFAULT 0,
            personal_growth INTEGER DEFAULT 0,
            existential INTEGER DEFAULT 0,
            complimentary INTEGER DEFAULT 0
          )`,
          [],
          (tx: any, results: any) => {
            const motivationalMessages = [
              "You are capable of amazing things!",
              "Every day is a new opportunity to grow.",
              "Believe in yourself and your abilities.",
              "Success comes to those who persist.",
              "Your potential is limitless.",
              "Today is full of possibilities.",
              "You have the strength to overcome any challenge.",
              "Your hard work will pay off."
            ];
            
            const demotivationalMessages = [
              "You're probably not as special as you think you are.",
              "Most people won't remember what you did today.",
              "Your problems aren't that unique.",
              "Mediocrity is more common than excellence.",
              "Life rarely goes according to plan.",
              "Your comfort zone is probably where you'll stay.",
              "Most dreams remain just that - dreams.",
              "Reality often disappoints."
            ];
            
            let insertCount = 0;
            const totalMessages = motivationalMessages.length + demotivationalMessages.length;
            
            const checkComplete = () => {
              if (insertCount === totalMessages) {
                resolve();
              }
            };
            
            motivationalMessages.forEach((message) => {
              tx.executeSql(
                'INSERT INTO messages (message, motivational) VALUES (?, ?)',
                [message, 1],
                () => { insertCount++; checkComplete(); },
                (tx: any, error: any) => reject(error)
              );
            });
            
            demotivationalMessages.forEach((message) => {
              tx.executeSql(
                'INSERT INTO messages (message, motivational) VALUES (?, ?)',
                [message, 0],
                () => { insertCount++; checkComplete(); },
                (tx: any, error: any) => reject(error)
              );
            });
          },
          (tx: any, error: any) => reject(error)
        );
      });
    });
  }

  static async getRandomMessage(isMotivational: boolean): Promise<string> {
    await this.initDatabase();

    if (!this.db) {
      return isMotivational ? 'Stay positive!' : "Life's meaningless anyway.";
    }

    try {
      const result = await new Promise<any>((resolve, reject) => {
        const query = 'SELECT message FROM messages WHERE motivational = ? ORDER BY RANDOM() LIMIT 1';
        const params = [isMotivational ? 1 : 0];
        
        this.db!.transaction((tx: any) => {
          tx.executeSql(
            query,
            params,
            (tx: any, results: any) => resolve(results),
            (tx: any, error: any) => reject(error)
          );
        });
      });

      if (result.rows.length > 0) {
        return result.rows.item(0).message;
      } else {
        return isMotivational ? 'Stay positive!' : "Life's meaningless anyway.";
      }
    } catch (error) {
      console.error('Failed to get random message:', error);
      return isMotivational ? 'Stay positive!' : "Life's meaningless anyway.";
    }
  }

  static async getMessagesWithFilters(filters: MessageFilters): Promise<string[]> {
    await this.initDatabase();

    if (!this.db) {
      console.error('Database is null');
      return [];
    }

    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      Object.entries(filters).forEach(([key, value]) => {
        if (value === true) {
          whereClause += ` AND ${key} = 1`;
        } else if (value === false) {
          whereClause += ` AND ${key} = 0`;
        }
      });

      const query = `SELECT message FROM messages ${whereClause}`;
      
      const result = await new Promise<any>((resolve, reject) => {
        this.db!.transaction((tx: any) => {
          tx.executeSql(
            query,
            params,
            (tx: any, results: any) => resolve(results),
            (tx: any, error: any) => reject(error)
          );
        });
      });

      const messages: string[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        messages.push(result.rows.item(i).message);
      }
      
      return messages;
    } catch (error) {
      console.error('Failed to get filtered messages:', error);
      return [];
    }
  }

  static async getAllMessages(): Promise<Message[]> {
    await this.initDatabase();

    if (!this.db) {
      console.error('Database is null');
      return [];
    }

    try {
      const result = await new Promise<any>((resolve, reject) => {
        this.db!.transaction((tx: any) => {
          tx.executeSql(
            'SELECT * FROM messages',
            [],
            (tx: any, results: any) => resolve(results),
            (tx: any, error: any) => reject(error)
          );
        });
      });

      const messages: Message[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        messages.push(result.rows.item(i));
      }
      
      return messages;
    } catch (error) {
      console.error('Failed to get all messages:', error);
      return [];
    }
  }
}