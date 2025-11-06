import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';

class DatabaseConnection {
  private static instance: SQLite.SQLiteDatabase | null = null;
  private static dbName: string = 'vinyl.db';

  static async getConnection(): Promise<SQLite.SQLiteDatabase> {
    if (!this.instance) {
      this.instance = await SQLite.openDatabaseAsync(this.dbName);
      await this.initialize(this.instance);
    }
    return this.instance;
  }

  private static async initialize(db: SQLite.SQLiteDatabase): Promise<void> {
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await this.runMigrations(db);
    console.log('Database connection initialized');
  }

  private static async runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
    await db.execAsync('CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY NOT NULL, version INTEGER NOT NULL);');
    
    const result = await db.getFirstAsync<{ version: number }>('SELECT MAX(version) as version FROM migrations;');
    let currentVersion = result?.version || 0;

    for (let i = currentVersion; i < migrations.length; i++) {
      try {
        await db.execAsync(migrations[i]);
        await db.runAsync('INSERT INTO migrations (version) VALUES (?);', i + 1);
        console.log(`Migration ${i + 1} executed successfully.`);
      } catch (error) {
        console.error(`Error executing migration ${i + 1}:`, error);
        // If a migration fails, you might want to handle it, e.g., by rolling back or stopping the app.
        throw error;
      }
    }
  }

  static async closeConnection(): Promise<void> {
    if (this.instance) {
      await this.instance.closeAsync();
      this.instance = null;
    }
  }
}

export default DatabaseConnection;
