/**
 * PostgreSQL Database Connection and Setup
 * Replaces SQLite with Neon PostgreSQL
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

class PostgresDatabaseManager {
  constructor() {
    this.pool = null;
    // Use the pooled connection string for better performance with Neon
    this.connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      console.log('🗄️  Initializing PostgreSQL database...');
      
      // Create connection pool
      this.pool = new Pool({
        connectionString: this.connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        max: 10,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
      });

      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      
      console.log('✅ PostgreSQL connection established:', result.rows[0].now);
      console.log('✅ Database initialized successfully');
      
      return this.pool;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get database pool
   */
  getPool() {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔒 Database connection closed');
    }
  }

  /**
   * Execute a query with parameters
   */
  async query(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Query failed:', error, { sql, params });
      throw error;
    }
  }

  /**
   * Execute a single row query
   */
  async queryOne(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Query failed:', error, { sql, params });
      throw error;
    }
  }

  /**
   * Execute an insert/update/delete query
   */
  async execute(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result;
    } catch (error) {
      console.error('❌ Execute failed:', error, { sql, params });
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(queries) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const { sql, params = [] } of queries) {
        await client.query(sql, params);
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
const postgresDbManager = new PostgresDatabaseManager();

module.exports = postgresDbManager;