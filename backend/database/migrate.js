/**
 * Data Migration Script
 * Migrates mock data to SQLite database
 */

const dbManager = require('./connection');
const mockData = require('../data/mockData');

class DataMigrator {
  constructor() {
    this.db = null;
  }

  async migrate() {
    try {
      console.log('🚀 Starting data migration...');
      
      // Initialize database
      this.db = dbManager.initialize();
      
      // Clear existing data (for fresh migration)
      await this.clearExistingData();
      
      // Migrate each data type
      await this.migrateMentors();
      await this.migrateStudents();
      await this.migrateResources();
      await this.migrateSessions();
      await this.migrateMentorshipRequests();
      await this.migrateNotifications();
      await this.migrateTestimonials();
      await this.migrateFaqs();
      await this.migratePlatformStats();
      await this.migrateReviews();
      
      console.log('✅ Data migration completed successfully!');
      
      // Show summary
      await this.showMigrationSummary();
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async clearExistingData() {
    console.log('🧹 Clearing existing data...');
    const tables = [
      'reviews', 'notifications', 'sessions', 'mentorship_requests', 
      'students', 'mentors', 'resources', 'testimonials', 'faqs', 'platform_stats'
    ];
    
    for (const table of tables) {
      this.db.exec(`DELETE FROM ${table}`);
    }
  }

  async migrateMentors() {
    console.log('👥 Migrating mentors...');
    
    const insertMentor = this.db.prepare(`
      INSERT INTO mentors (
        id, name, photo, company, position, biography, education, 
        years_experience, skills, industries, languages, availability, 
        rating, review_count, career_field, programme, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const mentor of mockData.mentors) {
      insertMentor.run([
        mentor.id,
        mentor.name,
        mentor.photo,
        mentor.company,
        mentor.position,
        mentor.biography,
        mentor.education,
        mentor.yearsExperience,
        JSON.stringify(mentor.skills || []),
        JSON.stringify(mentor.industries || []),
        JSON.stringify(mentor.languages || []),
        mentor.availability,
        mentor.rating,
        mentor.reviewCount,
        mentor.careerField,
        mentor.programme,
        mentor.isFeatured ? 1 : 0
      ]);
    }
    
    console.log(`✅ Migrated ${mockData.mentors.length} mentors`);
  }

  async migrateStudents() {
    console.log('🎓 Migrating students...');
    
    const insertStudent = this.db.prepare(`
      INSERT INTO students (
        id, name, programme, level, skills, interests, career_goals, career_field
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const student of mockData.students) {
      insertStudent.run([
        student.id,
        student.name,
        student.programme,
        student.level,
        JSON.stringify(student.skills || []),
        JSON.stringify(student.interests || []),
        JSON.stringify(student.careerGoals || []),
        student.careerField
      ]);
    }
    
    console.log(`✅ Migrated ${mockData.students.length} students`);
  }

  async migrateResources() {
    console.log('📚 Migrating resources...');
    
    const insertResource = this.db.prepare(`
      INSERT INTO resources (id, title, category, description, icon, read_time, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const resource of mockData.resources) {
      insertResource.run([
        resource.id,
        resource.title,
        resource.category,
        resource.description,
        resource.icon,
        resource.readTime,
        resource.type
      ]);
    }
    
    console.log(`✅ Migrated ${mockData.resources.length} resources`);
  }

  async migrateSessions() {
    console.log('📅 Migrating sessions...');
    
    const insertSession = this.db.prepare(`
      INSERT INTO sessions (id, student_id, mentor_id, mentor_name, title, date, time, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const session of mockData.sessions) {
      insertSession.run([
        session.id,
        session.studentId,
        session.mentorId,
        session.mentorName,
        session.title,
        session.date,
        session.time,
        session.status
      ]);
    }
    
    console.log(`✅ Migrated ${mockData.sessions.length} sessions`);
  }

  async migrateMentorshipRequests() {
    console.log('📝 Migrating mentorship requests...');
    
    const insertRequest = this.db.prepare(`
      INSERT INTO mentorship_requests (
        id, student_id, student_name, mentor_id, mentor_name, status, message, date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const request of mockData.mentorshipRequests) {
      insertRequest.run([
        request.id,
        request.studentId,
        request.studentName,
        request.mentorId,
        request.mentorName,
        request.status,
        request.message,
        request.date
      ]);
    }
    
    console.log(`✅ Migrated ${mockData.mentorshipRequests.length} mentorship requests`);
  }

  async migrateNotifications() {
    console.log('🔔 Migrating notifications...');
    
    const insertNotification = this.db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, is_read, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const notification of mockData.notifications) {
      insertNotification.run([
        notification.id,
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        notification.read ? 1 : 0,
        notification.date
      ]);
    }
    
    console.log(`✅ Migrated ${mockData.notifications.length} notifications`);
  }

  async migrateTestimonials() {
    console.log('💬 Migrating testimonials...');
    
    const insertTestimonial = this.db.prepare(`
      INSERT INTO testimonials (name, programme, photo, text, rating, is_featured)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const testimonial of mockData.testimonials) {
      insertTestimonial.run([
        testimonial.name,
        testimonial.programme,
        testimonial.photo,
        testimonial.text,
        testimonial.rating,
        1 // Mark as featured
      ]);
    }
    
    console.log(`✅ Migrated ${mockData.testimonials.length} testimonials`);
  }

  async migrateFaqs() {
    console.log('❓ Migrating FAQs...');
    
    const insertFaq = this.db.prepare(`
      INSERT INTO faqs (question, answer, display_order)
      VALUES (?, ?, ?)
    `);

    mockData.faqs.forEach((faq, index) => {
      insertFaq.run([
        faq.question,
        faq.answer,
        index + 1
      ]);
    });
    
    console.log(`✅ Migrated ${mockData.faqs.length} FAQs`);
  }

  async migratePlatformStats() {
    console.log('📊 Migrating platform stats...');
    
    const insertStats = this.db.prepare(`
      INSERT INTO platform_stats (
        id, total_students, total_mentors, total_sessions, satisfaction_rate
      ) VALUES (1, ?, ?, ?, ?)
    `);

    insertStats.run([
      mockData.stats.students,
      mockData.stats.mentors,
      mockData.stats.sessions,
      mockData.stats.satisfaction
    ]);
    
    console.log(`✅ Migrated platform statistics`);
  }

  async migrateReviews() {
    console.log('⭐ Migrating mentor reviews...');
    
    const insertReview = this.db.prepare(`
      INSERT INTO reviews (mentor_id, student_name, rating, text, date)
      VALUES (?, ?, ?, ?, ?)
    `);

    let reviewCount = 0;
    for (const mentor of mockData.mentors) {
      if (mentor.reviews && mentor.reviews.length > 0) {
        for (const review of mentor.reviews) {
          insertReview.run([
            mentor.id,
            review.student,
            review.rating,
            review.text,
            review.date
          ]);
          reviewCount++;
        }
      }
    }
    
    console.log(`✅ Migrated ${reviewCount} reviews`);
  }

  async showMigrationSummary() {
    console.log('\n📊 Migration Summary:');
    console.log('─────────────────────');
    
    const tables = [
      'mentors', 'students', 'resources', 'sessions', 
      'mentorship_requests', 'notifications', 'testimonials', 
      'faqs', 'reviews'
    ];
    
    for (const table of tables) {
      const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`${table.padEnd(20)}: ${result.count} records`);
    }
    
    console.log('─────────────────────');
    console.log('🎉 All data successfully migrated to SQLite!');
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new DataMigrator();
  migrator.migrate().catch(console.error);
}

module.exports = DataMigrator;