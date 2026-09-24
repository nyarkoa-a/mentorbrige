/**
 * Seed SQLite Database with Mock Data
 * Populates the database with realistic University of Ghana mentorship data
 */

const dbManager = require('./connection');
const mockData = require('../data/mockData');

function seedDatabase() {
  try {
    console.log('🌱 Starting SQLite database seeding...');
    
    // Initialize database connection
    const db = dbManager.initialize();
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    dbManager.execute('DELETE FROM notifications');
    dbManager.execute('DELETE FROM reviews');
    dbManager.execute('DELETE FROM sessions');
    dbManager.execute('DELETE FROM mentorship_requests');
    dbManager.execute('DELETE FROM students');
    dbManager.execute('DELETE FROM mentors');
    dbManager.execute('DELETE FROM resources');
    dbManager.execute('DELETE FROM testimonials');
    dbManager.execute('DELETE FROM faqs');
    dbManager.execute('DELETE FROM platform_stats');
    
    // Insert mentors
    console.log('👨‍🏫 Inserting mentors...');
    for (const mentor of mockData.mentors) {
      dbManager.execute(
        `INSERT INTO mentors (id, name, email, photo, company, position, biography, education, 
         years_experience, skills, industries, languages, availability, rating, review_count, 
         career_field, programme, is_featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mentor.id,
          mentor.name,
          `${mentor.name.toLowerCase().replace(' ', '.')}@example.com`,
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
          mentor.isFeatured ? 1 : 0
        ]
      );
      
      // Insert reviews for this mentor
      if (mentor.reviews && mentor.reviews.length > 0) {
        for (const review of mentor.reviews) {
          dbManager.execute(
            `INSERT INTO reviews (mentor_id, student_name, rating, text, is_approved)
             VALUES (?, ?, ?, ?, ?)`,
            [mentor.id, review.student, review.rating, review.text, 1]
          );
        }
      }
    }
    console.log(`✅ Inserted ${mockData.mentors.length} mentors`);
    
    // Insert students
    console.log('👨‍🎓 Inserting students...');
    for (const student of mockData.students) {
      dbManager.execute(
        `INSERT INTO students (id, name, email, programme, level, skills, interests, career_goals, career_field)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student.id,
          student.name,
          `${student.name.toLowerCase().replace(' ', '.')}@student.ug.edu.gh`,
          student.programme,
          student.level,
          JSON.stringify(student.skills),
          JSON.stringify(student.interests),
          JSON.stringify(student.careerGoals),
          student.careerField
        ]
      );
    }
    console.log(`✅ Inserted ${mockData.students.length} students`);
    
    // Insert resources
    console.log('📚 Inserting resources...');
    for (const resource of mockData.resources) {
      dbManager.execute(
        `INSERT INTO resources (id, title, category, description, icon, read_time, type, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          resource.id,
          resource.title,
          resource.category,
          resource.description,
          resource.icon,
          resource.readTime,
          resource.type,
          1
        ]
      );
    }
    console.log(`✅ Inserted ${mockData.resources.length} resources`);
    
    // Insert testimonials
    console.log('⭐ Inserting testimonials...');
    for (const testimonial of mockData.testimonials) {
      dbManager.execute(
        `INSERT INTO testimonials (name, programme, photo, text, rating, is_featured, is_approved)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          testimonial.name,
          testimonial.programme,
          testimonial.photo,
          testimonial.text,
          testimonial.rating,
          1,
          1
        ]
      );
    }
    console.log(`✅ Inserted ${mockData.testimonials.length} testimonials`);
    
    // Insert FAQs
    console.log('❓ Inserting FAQs...');
    for (const faq of mockData.faqs) {
      dbManager.execute(
        `INSERT INTO faqs (question, answer, category, is_published)
         VALUES (?, ?, ?, ?)`,
        [faq.question, faq.answer, 'general', 1]
      );
    }
    console.log(`✅ Inserted ${mockData.faqs.length} FAQs`);
    
    // Insert mentorship requests
    console.log('📋 Inserting mentorship requests...');
    for (const request of mockData.mentorshipRequests) {
      dbManager.execute(
        `INSERT INTO mentorship_requests (id, student_id, student_name, mentor_id, mentor_name, status, message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          request.id,
          request.studentId,
          request.studentName,
          request.mentorId,
          request.mentorName,
          request.status,
          request.message
        ]
      );
    }
    console.log(`✅ Inserted ${mockData.mentorshipRequests.length} mentorship requests`);
    
    // Insert sessions
    console.log('📅 Inserting sessions...');
    for (const session of mockData.sessions) {
      dbManager.execute(
        `INSERT INTO sessions (id, student_id, mentor_id, mentor_name, title, date, time, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
    console.log(`✅ Inserted ${mockData.sessions.length} sessions`);
    
    // Insert notifications
    console.log('🔔 Inserting notifications...');
    for (const notification of mockData.notifications) {
      dbManager.execute(
        `INSERT INTO notifications (user_id, type, title, message, is_read)
         VALUES (?, ?, ?, ?, ?)`,
        [
          notification.userId,
          notification.type,
          notification.title,
          notification.message,
          notification.read ? 1 : 0
        ]
      );
    }
    console.log(`✅ Inserted ${mockData.notifications.length} notifications`);
    
    // Insert platform stats
    console.log('📊 Inserting platform stats...');
    dbManager.execute(
      `INSERT OR REPLACE INTO platform_stats (id, total_students, total_mentors, total_sessions, satisfaction_rate)
       VALUES (1, ?, ?, ?, ?)`,
      [
        mockData.stats.students,
        mockData.stats.mentors,
        mockData.stats.sessions,
        mockData.stats.satisfaction
      ]
    );
    console.log(`✅ Inserted platform stats`);
    
    // Close database connection
    dbManager.close();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${mockData.mentors.length} mentors`);
    console.log(`   - ${mockData.students.length} students`);
    console.log(`   - ${mockData.resources.length} resources`);
    console.log(`   - ${mockData.testimonials.length} testimonials`);
    console.log(`   - ${mockData.faqs.length} FAQs`);
    console.log(`   - ${mockData.mentorshipRequests.length} mentorship requests`);
    console.log(`   - ${mockData.sessions.length} sessions`);
    console.log(`   - ${mockData.notifications.length} notifications`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run seeding
seedDatabase();