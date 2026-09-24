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

router.get('/dashboard', async (req, res) => {
  try {
    await initDb();
    // Get stats from database
    const mentorCount = (await postgresDbManager.queryOne('SELECT COUNT(*) as count FROM mentors'))?.count || 0;
    const studentCount = (await postgresDbManager.queryOne('SELECT COUNT(*) as count FROM students'))?.count || 0;
    const sessionCount = (await postgresDbManager.queryOne('SELECT COUNT(*) as count FROM sessions'))?.count || 0;

    const stats = {
      students: studentCount,
      mentors: mentorCount,
      sessions: sessionCount,
      satisfaction: 96 // Default satisfaction rate
    };

    // Get recent mentorship requests
    const recentRequests = await postgresDbManager.query(
      'SELECT * FROM mentorship_requests ORDER BY date DESC LIMIT 5'
    );

    // Get top mentors by rating (from the mentors table)
    const topMentors = (await postgresDbManager.query(
      'SELECT * FROM mentors ORDER BY rating DESC LIMIT 5'
    )).map(mentor => ({
      ...mentor,
      skills: mentor.skills || [],
      industries: mentor.industries || [],
      languages: mentor.languages || []
    }));

    // Get recent sessions
    const recentSessions = await postgresDbManager.query(
      'SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      stats,
      recentRequests,
      topMentors,
      recentSessions,
      monthlyGrowth: {
        students: [120, 145, 180, 210, 250, studentCount],
        sessions: [45, 52, 68, 75, 90, sessionCount],
        mentors: [12, 15, 18, 22, 25, mentorCount]
      }
    });
  } catch (error) {
    console.error('❌ Failed to fetch analytics data:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

module.exports = router;