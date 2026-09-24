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

router.get('/:userId', async (req, res) => {
  try {
    await initDb();
    const userNotifications = await postgresDbManager.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY date DESC',
      [req.params.userId]
    );
    res.json({ notifications: userNotifications });
  } catch (error) {
    console.error('❌ Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    await initDb();
    const result = await postgresDbManager.execute('UPDATE notifications SET is_read = TRUE WHERE id = $1', [req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = await postgresDbManager.queryOne('SELECT * FROM notifications WHERE id = $1', [req.params.id]);
    res.json(notification);
  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

module.exports = router;