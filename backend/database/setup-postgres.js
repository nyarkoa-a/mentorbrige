/**
 * PostgreSQL Database Setup and Migration
 * Creates tables and seeds initial data
 */

require('dotenv').config({ path: '../../.env' });
const postgresDbManager = require('./postgres-connection');
const fs = require('fs');
const path = require('path');
const mockData = require('../data/mockData');

async function setupDatabase() {
  try {
    console.log('🚀 Starting PostgreSQL database setup...');
    
    // Initialize connection
    await postgresDbManager.initialize();
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'postgres-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Creating database tables...');
    
    // Split schema into individual statements and execute them
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      try {
        await postgresDbManager.execute(statement);
      } catch (error) {
        // Ignore errors for IF NOT EXISTS statements or duplicate objects
        if (!error.message.includes('already exists')) {
          console.warn('⚠️  Warning executing statement:', error.message);
        }
      }
    }
    
    console.log('✅ Database tables created successfully');
    
    // Seed mentors
    console.log('👨‍🏫 Seeding mentors...');
    for (const mentor of mockData.mentors) {
      const existingMentor = await postgresDbManager.queryOne(
        'SELECT id FROM mentors WHERE id = $1',
        [mentor.id]
      );
      
      if (!existingMentor) {
        await postgresDbManager.execute(
          `INSERT INTO mentors (id, name, photo, company, position, biography, education, 
           years_experience, skills, industries, languages, availability, rating, review_count, 
           career_field, programme, is_featured) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            mentor.id,
            mentor.name,
            mentor.photo,
            mentor.company,
            mentor.position,
            mentor.biography,
            mentor.education,
            mentor.yearsExperience,
            JSON.stringify(mentor.skills),
            JSON.stringify(mentor.industries),
            JSON.stringify(mentor.languages),
            mentor.availability,
            mentor.rating,
            mentor.reviewCount,
            mentor.careerField,
            mentor.programme,
            mentor.isFeatured
          ]
        );
        
        // Seed reviews for this mentor
        if (mentor.reviews && mentor.reviews.length > 0) {
          for (const review of mentor.reviews) {
            await postgresDbManager.execute(
              `INSERT INTO reviews (mentor_id, student_name, rating, text, date) 
               VALUES ($1, $2, $3, $4, $5)`,
              [mentor.id, review.student, review.rating, review.text, review.date]
            );
          }
        }
      }
    }
    console.log(`✅ Seeded ${mockData.mentors.length} mentors`);
    
    // Seed resources
    console.log('📚 Seeding resources...');
    for (const resource of mockData.resources) {
      const existingResource = await postgresDbManager.queryOne(
        'SELECT id FROM resources WHERE id = $1',
        [resource.id]
      );
      
      if (!existingResource) {
        await postgresDbManager.execute(
          `INSERT INTO resources (id, title, category, description, icon, read_time, type) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            resource.id,
            resource.title,
            resource.category,
            resource.description,
            resource.icon,
            resource.readTime,
            resource.type
          ]
        );
      }
    }
    console.log(`✅ Seeded ${mockData.resources.length} resources`);
    
    // Seed testimonials
    console.log('💬 Seeding testimonials...');
    for (const testimonial of mockData.testimonials) {
      const existingTestimonial = await postgresDbManager.queryOne(
        'SELECT name FROM testimonials WHERE name = $1',
        [testimonial.name]
      );
      
      if (!existingTestimonial) {
        await postgresDbManager.execute(
          `INSERT INTO testimonials (name, programme, photo, text, rating) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            testimonial.name,
            testimonial.programme,
            testimonial.photo,
            testimonial.text,
            testimonial.rating
          ]
        );
      }
    }
    console.log(`✅ Seeded ${mockData.testimonials.length} testimonials`);
    
    // Seed FAQs
    console.log('❓ Seeding FAQs...');
    for (const faq of mockData.faqs) {
      const existingFaq = await postgresDbManager.queryOne(
        'SELECT question FROM faqs WHERE question = $1',
        [faq.question]
      );
      
      if (!existingFaq) {
        await postgresDbManager.execute(
          `INSERT INTO faqs (question, answer, category) 
           VALUES ($1, $2, $3)`,
          [faq.question, faq.answer, 'general']
        );
      }
    }
    console.log(`✅ Seeded ${mockData.faqs.length} FAQs`);
    
    // Seed platform stats
    console.log('📊 Seeding platform statistics...');
    const existingStats = await postgresDbManager.queryOne(
      'SELECT id FROM platform_stats WHERE id = 1'
    );
    
    if (!existingStats) {
      await postgresDbManager.execute(
        `INSERT INTO platform_stats (id, total_students, total_mentors, total_sessions, satisfaction_rate) 
         VALUES (1, $1, $2, $3, $4)`,
        [
          mockData.stats.students,
          mockData.stats.mentors,
          mockData.stats.sessions,
          mockData.stats.satisfaction
        ]
      );
    }
    console.log('✅ Platform statistics seeded');
    
    // Seed students
    console.log('👨‍🎓 Seeding students...');
    for (const student of mockData.students) {
      const existingStudent = await postgresDbManager.queryOne(
        'SELECT id FROM students WHERE id = $1',
        [student.id]
      );
      
      if (!existingStudent) {
        await postgresDbManager.execute(
          `INSERT INTO students (id, name, programme, level, skills, interests, career_goals, career_field) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            student.id,
            student.name,
            student.programme,
            student.level,
            JSON.stringify(student.skills),
            JSON.stringify(student.interests),
            JSON.stringify(student.careerGoals),
            student.careerField
          ]
        );
      }
    }
    console.log(`✅ Seeded ${mockData.students.length} students`);
    
    // Seed mentorship requests
    console.log('📋 Seeding mentorship requests...');
    for (const request of mockData.mentorshipRequests) {
      const existingRequest = await postgresDbManager.queryOne(
        'SELECT id FROM mentorship_requests WHERE id = $1',
        [request.id]
      );
      
      if (!existingRequest) {
        await postgresDbManager.execute(
          `INSERT INTO mentorship_requests (id, student_id, student_name, mentor_id, mentor_name, status, message, date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            request.id,
            request.studentId,
            request.studentName,
            request.mentorId,
            request.mentorName,
            request.status,
            request.message,
            request.date
          ]
        );
      }
    }
    console.log(`✅ Seeded ${mockData.mentorshipRequests.length} mentorship requests`);
    
    // Seed sessions
    console.log('📅 Seeding sessions...');
    for (const session of mockData.sessions) {
      const existingSession = await postgresDbManager.queryOne(
        'SELECT id FROM sessions WHERE id = $1',
        [session.id]
      );
      
      if (!existingSession) {
        await postgresDbManager.execute(
          `INSERT INTO sessions (id, student_id, mentor_id, mentor_name, title, date, time, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            session.id,
            session.studentId,
            session.mentorId,
            session.mentorName,
            session.title,
            session.date,
            session.time,
            session.status
          ]
        );
      }
    }
    console.log(`✅ Seeded ${mockData.sessions.length} sessions`);
    
    // Seed notifications
    console.log('🔔 Seeding notifications...');
    for (const notification of mockData.notifications) {
      const existingNotification = await postgresDbManager.queryOne(
        'SELECT id FROM notifications WHERE id = $1',
        [notification.id]
      );
      
      if (!existingNotification) {
        await postgresDbManager.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, is_read, date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            notification.id,
            notification.userId,
            notification.type,
            notification.title,
            notification.message,
            notification.read,
            notification.date
          ]
        );
      }
    }
    console.log(`✅ Seeded ${mockData.notifications.length} notifications`);
    
    console.log('🎉 PostgreSQL database setup completed successfully!');
    
    // Close connection
    await postgresDbManager.close();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase();