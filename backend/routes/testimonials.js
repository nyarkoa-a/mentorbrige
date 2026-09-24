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
    const testimonials = await postgresDbManager.query(
      'SELECT * FROM testimonials WHERE is_approved = TRUE ORDER BY is_featured DESC, created_at DESC'
    );
    res.json({ testimonials });
  } catch (error) {
    console.error('❌ Failed to fetch testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await initDb();
    const testimonial = await postgresDbManager.queryOne('SELECT * FROM testimonials WHERE id = $1', [req.params.id]);
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.json(testimonial);
  } catch (error) {
    console.error('❌ Failed to fetch testimonial:', error);
    res.status(500).json({ error: 'Failed to fetch testimonial' });
  }
});

module.exports = router;