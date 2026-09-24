/**
 * SQLite Database Connection and Setup
 * Replaces mock data with persistent SQLite database
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, 'mentorbridge.db');
    this.schemaPath = path.join(__dirname, 'schema.sql');
  }

  /**
   * Initialize database connection and create tables
   */
  initialize() {
    try {
      console.log('🗄️  Initializing SQLite database...');
      
      // Create database connection
      this.db = new Database(this.dbPath);
      
      // Enable WAL mode for better concurrent access
      this.db.pragma('journal_mode = WAL');
      
      // Create tables from schema
      this.createTables();
      
      console.log('✅ Database initialized successfully');
      return this.db;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables from schema file
   */
  createTables() {
    try {
      const schema = fs.readFileSync(this.schemaPath, 'utf8');
      this.db.exec(schema);
      console.log('✅ Database tables created/verified');
    } catch (error) {
      console.error('❌ Failed to create tables:', error);
      throw error;
    }
  }

  /**
   * Get database connection
   */
  getDatabase() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('🔒 Database connection closed');
    }
  }

  /**
   * Execute a query with parameters
   */
  query(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(params);
    } catch (error) {
      console.error('❌ Query failed:', error, { sql, params });
      throw error;
    }
  }

  /**
   * Execute a single row query
   */
  queryOne(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.get(params);
    } catch (error) {
      console.error('❌ Query failed:', error, { sql, params });
      throw error;
    }
  }

  /**
   * Execute an insert/update/delete query
   */
  execute(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.run(params);
    } catch (error) {
      console.error('❌ Execute failed:', error, { sql, params });
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  transaction(queries) {
    const transaction = this.db.transaction(() => {
      for (const { sql, params = [] } of queries) {
        const stmt = this.db.prepare(sql);
        stmt.run(params);
      }
    });
    return transaction();
  }

  /**
   * Helper method to parse JSON fields
   */
  parseJsonField(value) {
    if (!value) return [];
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return [];
    }
  }

  /**
   * Helper method to stringify JSON fields
   */
  stringifyJsonField(value) {
    if (!value) return '[]';
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;