import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database Service
 * Manages SQLite database connection and provides query methods
 */
export class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Default to data/apologize.db in project root
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'apologize.db');
  }

  /**
   * Initialize database connection and schema
   */
  public async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        logger.info('Created data directory', { path: dataDir });
      }

      // Open database connection
      this.db = new Database(this.dbPath);
      logger.info('Database connection established', { path: this.dbPath });

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Run migrations
      await this.runMigrations();

      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Database initialization failed', { error });
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Read schema file
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');

      // Execute schema (creates tables if not exist)
      this.db.exec(schema);

      logger.info('Database migrations completed');

      // Create default admin user if not exists
      await this.createDefaultAdmin();
    } catch (error) {
      logger.error('Migration failed', { error });
      throw error;
    }
  }

  /**
   * Create default admin user with bcrypt hashed password
   * Uses environment variables for configuration:
   * - DEFAULT_ADMIN_USERNAME: Admin username (optional, skips creation if not set)
   * - DEFAULT_ADMIN_PASSWORD: Admin password (optional, generates random if not set)
   */
  private async createDefaultAdmin(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const adminUsername = process.env.DEFAULT_ADMIN_USERNAME;
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

      if (!adminUsername) {
        logger.info('DEFAULT_ADMIN_USERNAME not set, skipping admin creation');
        return;
      }

      // Check if admin already exists
      const stmt = this.db.prepare('SELECT id FROM users WHERE username = ?');
      const admin = stmt.get(adminUsername);

      if (!admin) {
        // Import required modules
        const bcrypt = await import('bcrypt');
        const crypto = await import('crypto');

        // Generate random password if not provided
        const password = adminPassword || crypto.randomBytes(16).toString('hex');
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert default admin
        const insertStmt = this.db.prepare(`
          INSERT INTO users (username, password_hash, role)
          VALUES (?, ?, ?)
        `);
        insertStmt.run(adminUsername, passwordHash, 'admin');

        if (!adminPassword) {
          logger.warn('⚠️  DEFAULT ADMIN CREDENTIALS ⚠️', {
            username: adminUsername,
            password: password,
            message: 'SAVE THESE CREDENTIALS! Password was auto-generated.',
          });
          console.warn('\n' + '='.repeat(80));
          console.warn('⚠️  AUTO-GENERATED ADMIN CREDENTIALS - SAVE IMMEDIATELY! ⚠️');
          console.warn('='.repeat(80));
          console.warn(`Username: ${adminUsername}`);
          console.warn(`Password: ${password}`);
          console.warn('='.repeat(80) + '\n');
        } else {
          logger.info('Default admin user created', { username: adminUsername });
          logger.warn('SECURITY: Please change the default admin password immediately!');
        }
      } else {
        logger.debug('Admin user already exists, skipping creation', { username: adminUsername });
      }
    } catch (error) {
      logger.error('Failed to create default admin', { error });
      // Don't throw - allow app to continue even if admin creation fails
    }
  }

  /**
   * Get database instance
   */
  public getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Execute a query and return all results
   */
  public query<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = this.db.prepare(sql);
      const results = stmt.all(...params) as T[];
      return results;
    } catch (error) {
      logger.error('Query failed', { sql, params, error });
      throw error;
    }
  }

  /**
   * Execute a query and return the first result
   */
  public queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.get(...params) as T | undefined;
      return result;
    } catch (error) {
      logger.error('Query failed', { sql, params, error });
      throw error;
    }
  }

  /**
   * Execute an insert/update/delete query
   */
  public execute(sql: string, params: any[] = []): Database.RunResult {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...params);
      return result;
    } catch (error) {
      logger.error('Execute failed', { sql, params, error });
      throw error;
    }
  }

  /**
   * Execute multiple statements in a transaction
   */
  public transaction<T>(callback: () => T): T {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const fn = this.db.transaction(callback);
    return fn();
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('Database connection closed');
    }
  }

  /**
   * Check if database is initialized
   */
  public isInitialized(): boolean {
    return this.db !== null;
  }
}

// Export singleton instance
export const db = new DatabaseService();

// Initialize on module load
db.initialize().catch((error) => {
  logger.error('Failed to initialize database on startup', { error });
  process.exit(1);
});
