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

/**
 * AI Mentor Matching Algorithm
 * Scores mentors based on student profile compatibility
 * Modular design — can be replaced with ML model later
 */
function calculateMatchScore(student, mentor) {
  let score = 0;
  const weights = {
    programme: 25,
    careerField: 20,
    skills: 20,
    interests: 15,
    careerGoals: 15,
    level: 5
  };

  if (student.programme && mentor.programme &&
      student.programme.toLowerCase() === mentor.programme.toLowerCase()) {
    score += weights.programme;
  } else if (student.careerField && mentor.career_field &&
             student.careerField.toLowerCase() === mentor.career_field.toLowerCase()) {
    score += weights.programme * 0.6;
  }

  if (student.careerField && mentor.career_field &&
      student.careerField.toLowerCase() === mentor.career_field.toLowerCase()) {
    score += weights.careerField;
  }

  if (student.skills && mentor.skills) {
    const studentSkills = student.skills.map(s => s.toLowerCase());
    const mentorSkills = Array.isArray(mentor.skills) ? mentor.skills : (mentor.skills || []);
    const matchingSkills = mentorSkills.filter(s => studentSkills.includes(s.toLowerCase()));
    score += (matchingSkills.length / Math.max(studentSkills.length, 1)) * weights.skills;
  }

  if (student.interests && mentor.industries) {
    const interests = student.interests.map(i => i.toLowerCase());
    const mentorIndustries = Array.isArray(mentor.industries) ? mentor.industries : (mentor.industries || []);
    const matchingInterests = mentorIndustries.filter(i =>
      interests.some(int => i.toLowerCase().includes(int) || int.includes(i.toLowerCase()))
    );
    score += (matchingInterests.length / Math.max(interests.length, 1)) * weights.interests;
  }

  if (student.careerGoals && mentor.skills) {
    const goals = student.careerGoals.map(g => g.toLowerCase());
    const mentorSkills = Array.isArray(mentor.skills) ? mentor.skills : (mentor.skills || []);
    const goalMatches = goals.filter(g => mentorSkills.some(s => g.includes(s.toLowerCase()) || s.toLowerCase().includes(g)));
    score += (goalMatches.length / Math.max(goals.length, 1)) * weights.careerGoals;
  }

  score += weights.level;
  score += (mentor.rating || 0) * 2;

  return Math.min(Math.round(score), 100);
}

router.post('/recommend', async (req, res) => {
  try {
    await initDb();
    const student = req.body;
    if (!student) {
      return res.status(400).json({ error: 'Student profile required' });
    }

    // Get all mentors from database
    const mentors = await postgresDbManager.query('SELECT * FROM mentors ORDER BY rating DESC');

    const recommendations = mentors
      .map(mentor => {
        // Parse JSON fields for matching
        const mentorWithParsedFields = {
          ...mentor,
          skills: mentor.skills || [],
          industries: mentor.industries || [],
          languages: mentor.languages || []
        };

        return {
          ...mentorWithParsedFields,
          matchScore: calculateMatchScore(student, mentorWithParsedFields),
          matchReasons: getMatchReasons(student, mentorWithParsedFields)
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

    res.json({ recommendations, algorithm: 'compatibility-v1' });
  } catch (error) {
    console.error('❌ Failed to generate recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

router.post('/demo', async (req, res) => {
  try {
    await initDb();
    const demoStudent = req.body || {
      programme: 'Computer Science',
      level: 'Level 300',
      skills: ['JavaScript', 'Python'],
      interests: ['Software Engineering', 'Technology'],
      careerGoals: ['Full-stack Developer'],
      careerField: 'Software Engineering'
    };

    // Get all mentors from database
    const mentors = await postgresDbManager.query('SELECT * FROM mentors ORDER BY rating DESC');

    const recommendations = mentors
      .map(mentor => {
        // Parse JSON fields for matching
        const mentorWithParsedFields = {
          ...mentor,
          skills: mentor.skills || [],
          industries: mentor.industries || []
        };

        return {
          id: mentor.id,
          name: mentor.name,
          company: mentor.company,
          photo: mentor.photo,
          matchScore: calculateMatchScore(demoStudent, mentorWithParsedFields),
          matchReasons: getMatchReasons(demoStudent, mentorWithParsedFields)
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    res.json({ recommendations });
  } catch (error) {
    console.error('❌ Failed to generate demo recommendations:', error);
    res.status(500).json({ error: 'Failed to generate demo recommendations' });
  }
});

function getMatchReasons(student, mentor) {
  const reasons = [];
  
  if (student.programme && mentor.programme &&
      student.programme.toLowerCase() === mentor.programme.toLowerCase()) {
    reasons.push(`Same programme: ${mentor.programme}`);
  }
  
  if (student.careerField && mentor.career_field &&
      student.careerField.toLowerCase() === mentor.career_field.toLowerCase()) {
    reasons.push(`Career field match: ${mentor.career_field}`);
  }
  
  if (student.skills && mentor.skills) {
    const mentorSkills = Array.isArray(mentor.skills) ? mentor.skills : (mentor.skills || []);
    const matches = student.skills.filter(s =>
      mentorSkills.some(ms => ms.toLowerCase() === s.toLowerCase())
    );
    if (matches.length) reasons.push(`Shared skills: ${matches.join(', ')}`);
  }
  
  if (mentor.rating >= 4.8) reasons.push(`Highly rated (${mentor.rating}/5)`);
  
  return reasons.slice(0, 3);
}

module.exports = router;
