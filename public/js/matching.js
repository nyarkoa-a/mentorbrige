/**
 * MentorBridge AI Matching Module (Client-side)
 * Modular compatibility scoring — can be replaced by a real AI model later
 */
const MentorMatching = {
  weights: {
    programme: 25,
    careerField: 20,
    skills: 20,
    interests: 15,
    careerGoals: 15,
    level: 5
  },

  calculateScore(student, mentor) {
    let score = 0;
    const w = this.weights;

    if (student.programme && mentor.programme &&
        student.programme.toLowerCase() === mentor.programme.toLowerCase()) {
      score += w.programme;
    } else if (student.careerField && mentor.careerField &&
               student.careerField.toLowerCase() === mentor.careerField.toLowerCase()) {
      score += w.programme * 0.6;
    }

    if (student.careerField && mentor.careerField &&
        student.careerField.toLowerCase() === mentor.careerField.toLowerCase()) {
      score += w.careerField;
    }

    if (student.skills?.length && mentor.skills?.length) {
      const studentSkills = student.skills.map(s => s.toLowerCase());
      const matches = mentor.skills.filter(s => studentSkills.includes(s.toLowerCase()));
      score += (matches.length / Math.max(studentSkills.length, 1)) * w.skills;
    }

    if (student.interests?.length && mentor.industries?.length) {
      const interests = student.interests.map(i => i.toLowerCase());
      const matches = mentor.industries.filter(i =>
        interests.some(int => i.toLowerCase().includes(int) || int.includes(i.toLowerCase()))
      );
      score += (matches.length / Math.max(interests.length, 1)) * w.interests;
    }

    if (student.careerGoals?.length && mentor.skills?.length) {
      const goals = student.careerGoals.map(g => g.toLowerCase());
      const mentorSkills = mentor.skills.map(s => s.toLowerCase());
      const matches = goals.filter(g => mentorSkills.some(s => g.includes(s) || s.includes(g)));
      score += (matches.length / Math.max(goals.length, 1)) * w.careerGoals;
    }

    score += w.level;
    if (mentor.rating) score += mentor.rating * 2;

    return Math.min(Math.round(score), 100);
  },

  getMatchReasons(student, mentor) {
    const reasons = [];
    if (student.programme && mentor.programme &&
        student.programme.toLowerCase() === mentor.programme.toLowerCase()) {
      reasons.push(`Same programme: ${mentor.programme}`);
    }
    if (student.careerField && mentor.careerField &&
        student.careerField.toLowerCase() === mentor.careerField.toLowerCase()) {
      reasons.push(`Career field: ${mentor.careerField}`);
    }
    if (student.skills?.length && mentor.skills?.length) {
      const matches = student.skills.filter(s =>
        mentor.skills.some(ms => ms.toLowerCase() === s.toLowerCase())
      );
      if (matches.length) reasons.push(`Shared skills: ${matches.join(', ')}`);
    }
    if (mentor.rating >= 4.8) reasons.push(`Highly rated (${mentor.rating}/5)`);
    return reasons.slice(0, 3);
  },

  getScoreClass(score) {
    if (score >= 80) return 'match-score-high';
    if (score >= 60) return 'match-score-medium';
    return 'match-score-low';
  }
};

window.MentorMatching = MentorMatching;
