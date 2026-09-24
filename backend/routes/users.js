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

router.get('/students', async (req, res) => {
  try {
    await initDb();
    const students = await postgresDbManager.query('SELECT * FROM students ORDER BY name');
    // Parse JSON fields
    const studentsWithParsedFields = students.map(student => ({
      ...student,
      skills: student.skills || [],
      interests: student.interests || [],
      careerGoals: student.career_goals || []
    }));
    res.json({ students: studentsWithParsedFields });
  } catch (error) {
    console.error('❌ Failed to fetch students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.get('/students/:id', async (req, res) => {
  try {
    await initDb();
    const student = await postgresDbManager.queryOne('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    // Parse JSON fields
    const studentWithParsedFields = {
      ...student,
      skills: student.skills || [],
      interests: student.interests || [],
      careerGoals: student.career_goals || []
    };
    res.json(studentWithParsedFields);
  } catch (error) {
    console.error('❌ Failed to fetch student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

router.get('/requests', async (req, res) => {
  try {
    await initDb();
    const requests = await postgresDbManager.query('SELECT * FROM mentorship_requests ORDER BY date DESC');
    res.json({ requests });
  } catch (error) {
    console.error('❌ Failed to fetch mentorship requests:', error);
    res.status(500).json({ error: 'Failed to fetch mentorship requests' });
  }
});

router.post('/requests', async (req, res) => {
  try {
    await initDb();
    const { studentId, studentName, mentorId, mentorName, message } = req.body;
    
    if (!studentId || !mentorId || !message) {
      return res.status(400).json({ error: 'studentId, mentorId, and message are required' });
    }

    const requestId = `req${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];
    
    await postgresDbManager.execute(
      'INSERT INTO mentorship_requests (id, student_id, student_name, mentor_id, mentor_name, status, message, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [requestId, studentId, studentName, mentorId, mentorName, 'pending', message, date]
    );

    const newRequest = {
      id: requestId,
      studentId,
      studentName,
      mentorId,
      mentorName,
      status: 'pending',
      message,
      date
    };

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('❌ Failed to create mentorship request:', error);
    res.status(500).json({ error: 'Failed to create mentorship request' });
  }
});

module.exports = router;