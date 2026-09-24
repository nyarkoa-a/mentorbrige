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
    const { featured, industry, skill, careerField, search, minExperience, minRating } = req.query;
    
    let sql = `
      SELECT id, name, photo, company, position, biography, education, 
             years_experience, skills, industries, languages, availability, 
             rating, review_count, career_field, programme, is_featured,
             created_at, updated_at
      FROM mentors 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (featured === 'true') {
      sql += ` AND is_featured = TRUE`;
    }
    
    if (industry) {
      sql += ` AND industries::text ILIKE $${paramIndex}`;
      params.push(`%${industry}%`);
      paramIndex++;
    }
    
    if (skill) {
      sql += ` AND skills::text ILIKE $${paramIndex}`;
      params.push(`%${skill}%`);
      paramIndex++;
    }
    
    if (careerField) {
      sql += ` AND career_field = $${paramIndex}`;
      params.push(careerField);
      paramIndex++;
    }
    
    if (search) {
      sql += ` AND (name ILIKE $${paramIndex} OR company ILIKE $${paramIndex + 1} OR skills::text ILIKE $${paramIndex + 2})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      paramIndex += 3;
    }
    
    if (minExperience) {
      sql += ` AND years_experience >= $${paramIndex}`;
      params.push(parseInt(minExperience));
      paramIndex++;
    }
    
    if (minRating) {
      sql += ` AND rating >= $${paramIndex}`;
      params.push(parseFloat(minRating));
      paramIndex++;
    }
    
    sql += ' ORDER BY rating DESC, review_count DESC';
    
    const mentors = await postgresDbManager.query(sql, params);
    
    // Parse JSON fields
    const formattedMentors = mentors.map(mentor => ({
      ...mentor,
      skills: mentor.skills || [],
      industries: mentor.industries || [],
      languages: mentor.languages || [],
      isFeatured: Boolean(mentor.is_featured),
      yearsExperience: mentor.years_experience,
      reviewCount: mentor.review_count,
      careerField: mentor.career_field
    }));

    res.json({ mentors: formattedMentors, total: formattedMentors.length });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ error: 'Failed to fetch mentors' });
  }
});

router.get('/filters', async (req, res) => {
  try {
    await initDb();
    const mentors = await postgresDbManager.query('SELECT industries, skills, career_field FROM mentors');
    
    const industries = new Set();
    const skills = new Set();
    const careerFields = new Set();
    
    mentors.forEach(mentor => {
      const mentorIndustries = mentor.industries || [];
      const mentorSkills = mentor.skills || [];
      
      mentorIndustries.forEach(industry => industries.add(industry));
      mentorSkills.forEach(skill => skills.add(skill));
      if (mentor.career_field) careerFields.add(mentor.career_field);
    });
    
    res.json({
      industries: [...industries].sort(),
      skills: [...skills].sort(),
      careerFields: [...careerFields].sort()
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await initDb();
    const mentor = await postgresDbManager.queryOne('SELECT * FROM mentors WHERE id = $1', [req.params.id]);
    
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }
    
    // Get mentor reviews
    const reviews = await postgresDbManager.query('SELECT * FROM reviews WHERE mentor_id = $1 ORDER BY date DESC', [req.params.id]);
    
    // Format response
    const formattedMentor = {
      ...mentor,
      skills: mentor.skills || [],
      industries: mentor.industries || [],
      languages: mentor.languages || [],
      isFeatured: Boolean(mentor.is_featured),
      yearsExperience: mentor.years_experience,
      reviewCount: mentor.review_count,
      careerField: mentor.career_field,
      reviews: reviews.map(review => ({
        student: review.student_name,
        rating: review.rating,
        text: review.text,
        date: review.date
      }))
    };
    
    res.json(formattedMentor);
  } catch (error) {
    console.error('Error fetching mentor:', error);
    res.status(500).json({ error: 'Failed to fetch mentor' });
  }
});

module.exports = router;