/**
 * MentorBridge Sessions API
 * Handles listing, creating, updating, and cancelling sessions using PostgreSQL
 */
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

// GET /api/sessions — list all (filter by status if ?status=upcoming etc.)
router.get('/', async (req, res) => {
  try {
    await initDb();
    const { status, mentorId, menteeId } = req.query;
    let sql = 'SELECT * FROM sessions';
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (mentorId) {
      conditions.push(`mentor_id = $${paramIndex}`);
      params.push(mentorId);
      paramIndex++;
    }
    if (menteeId) {
      conditions.push(`student_id = $${paramIndex}`);
      params.push(menteeId);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY date DESC';

    const sessions = await postgresDbManager.query(sql, params);
    
    // Map database fields to expected API format
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      menteeId: session.student_id,
      menteeName: 'Amina Boateng', // Default for now
      menteePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
      mentorId: session.mentor_id,
      mentorName: session.mentor_name,
      mentorPhoto: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=80&h=80&fit=crop&crop=face', // Default
      mentorTitle: 'Engineering Manager', // Default
      title: session.title,
      topic: session.title, // Use title as topic
      date: session.date,
      time: session.time,
      duration: 45, // Default duration
      status: session.status,
      type: 'video',
      notes: session.notes || '',
      description: session.description || '',
      cancelReason: ''
    }));

    res.json({ sessions: formattedSessions, total: formattedSessions.length });
  } catch (error) {
    console.error('❌ Failed to fetch sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  try {
    await initDb();
    const session = await postgresDbManager.queryOne('SELECT * FROM sessions WHERE id = $1', [req.params.id]);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Map database fields to expected API format
    const formattedSession = {
      id: session.id,
      menteeId: session.student_id,
      menteeName: 'Amina Boateng',
      menteePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
      mentorId: session.mentor_id,
      mentorName: session.mentor_name,
      mentorPhoto: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=80&h=80&fit=crop&crop=face',
      mentorTitle: 'Engineering Manager',
      title: session.title,
      topic: session.title,
      date: session.date,
      time: session.time,
      duration: 45,
      status: session.status,
      type: 'video',
      notes: session.notes || '',
      description: session.description || '',
      cancelReason: ''
    };

    res.json(formattedSession);
  } catch (error) {
    console.error('❌ Failed to fetch session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST /api/sessions — create a new session
router.post('/', async (req, res) => {
  try {
    await initDb();
    const { mentorId, mentorName, title, topic, date, time, description } = req.body;
    
    if (!mentorId || !date || !time || !topic) {
      return res.status(400).json({ error: 'mentorId, date, time, and topic are required' });
    }

    // Check for double booking on same mentor + date + time
    const conflict = await postgresDbManager.queryOne(
      'SELECT id FROM sessions WHERE mentor_id = $1 AND date = $2 AND time = $3 AND status = $4',
      [mentorId, date, time, 'upcoming']
    );
    
    if (conflict) {
      return res.status(409).json({ error: 'This time slot is no longer available. Please choose another time.' });
    }

    const sessionId = `sess${Date.now()}`;
    const sessionTitle = title || topic + ' Session';

    await postgresDbManager.execute(
      'INSERT INTO sessions (id, student_id, mentor_id, mentor_name, title, description, date, time, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [sessionId, 's1', mentorId, mentorName || '', sessionTitle, description || '', date, time, 'upcoming', '']
    );

    // Return formatted session
    const formattedSession = {
      id: sessionId,
      menteeId: 's1',
      menteeName: 'Amina Boateng',
      menteePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
      mentorId,
      mentorName: mentorName || '',
      mentorPhoto: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=80&h=80&fit=crop&crop=face',
      mentorTitle: 'Engineering Manager',
      title: sessionTitle,
      topic,
      date,
      time,
      duration: 45,
      status: 'upcoming',
      type: 'video',
      notes: '',
      description: description || '',
      cancelReason: ''
    };

    res.status(201).json(formattedSession);
  } catch (error) {
    console.error('❌ Failed to create session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PATCH /api/sessions/:id — update (reschedule, cancel, add notes)
router.patch('/:id', async (req, res) => {
  try {
    await initDb();
    const sessionId = req.params.id;
    const session = await postgresDbManager.queryOne('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { status, date, time, notes, description } = req.body;

    // Check reschedule conflict
    if (date && time && status !== 'cancelled') {
      const conflict = await postgresDbManager.queryOne(
        'SELECT id FROM sessions WHERE mentor_id = $1 AND date = $2 AND time = $3 AND status = $4 AND id != $5',
        [session.mentor_id, date, time, 'upcoming', sessionId]
      );
      
      if (conflict) {
        return res.status(409).json({ error: 'This time slot is no longer available. Please choose another time.' });
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    if (date !== undefined) {
      updates.push(`date = $${paramIndex}`);
      values.push(date);
      paramIndex++;
    }
    if (time !== undefined) {
      updates.push(`time = $${paramIndex}`);
      values.push(time);
      paramIndex++;
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(notes);
      paramIndex++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (updates.length > 0) {
      values.push(sessionId);
      await postgresDbManager.execute(
        `UPDATE sessions SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }

    // Fetch updated session and format it
    const updatedSession = await postgresDbManager.queryOne('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    const formattedSession = {
      id: updatedSession.id,
      menteeId: updatedSession.student_id,
      menteeName: 'Amina Boateng',
      menteePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
      mentorId: updatedSession.mentor_id,
      mentorName: updatedSession.mentor_name,
      mentorPhoto: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=80&h=80&fit=crop&crop=face',
      mentorTitle: 'Engineering Manager',
      title: updatedSession.title,
      topic: updatedSession.title,
      date: updatedSession.date,
      time: updatedSession.time,
      duration: 45,
      status: updatedSession.status,
      type: 'video',
      notes: updatedSession.notes || '',
      description: updatedSession.description || '',
      cancelReason: ''
    };

    res.json(formattedSession);
  } catch (error) {
    console.error('❌ Failed to update session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// GET /api/sessions/availability/:mentorId — available time slots for a mentor
router.get('/availability/:mentorId', async (req, res) => {
  try {
    await initDb();
    const { date } = req.query;
    const allSlots = ['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00'];
    
    const booked = (await postgresDbManager.query(
      'SELECT time FROM sessions WHERE mentor_id = $1 AND date = $2 AND status = $3',
      [req.params.mentorId, date, 'upcoming']
    )).map(session => session.time);
    
    const available = allSlots.filter(t => !booked.includes(t));
    res.json({ date, available, booked });
  } catch (error) {
    console.error('❌ Failed to fetch availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

module.exports = router;
