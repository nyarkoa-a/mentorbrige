const express = require('express');
const postgresDbManager = require('../database/postgres-connection');

const router = express.Router();

// Initialize database connection
let dbPool;
async function initDb() {
  if (!dbPool) {
    dbPool = await postgresDbManager.initialize();
  }
  return dbPool;
}

router.get('/', async (req, res) => {
  try {
    await initDb();
    const { category, search } = req.query;
    let sql = 'SELECT * FROM resources WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND LOWER(category) = LOWER($${paramIndex})`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (LOWER(title) ILIKE $${paramIndex} OR LOWER(description) ILIKE $${paramIndex + 1} OR LOWER(category) ILIKE $${paramIndex + 2})`;
      const searchTerm = `%${search.toLowerCase()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      paramIndex += 3;
    }

    sql += ' ORDER BY title';
    
    const resources = await postgresDbManager.query(sql, params);
    res.json({ resources });
  } catch (error) {
    console.error('❌ Failed to fetch resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await initDb();
    const resource = await postgresDbManager.queryOne('SELECT * FROM resources WHERE id = $1', [req.params.id]);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    console.error('❌ Failed to fetch resource:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

module.exports = router;