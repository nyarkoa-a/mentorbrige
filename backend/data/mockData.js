/**
 * Mock data for MentorBridge
 * Realistic University of Ghana content
 */

const mentors = [
  {
    id: 'm1',
    name: 'Dr. Kwame Asante',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    company: 'Google Ghana',
    position: 'Senior Software Engineer',
    biography: 'Computer Science graduate from University of Ghana with 12 years in tech. Passionate about helping students navigate careers in software engineering and product development across Africa.',
    education: 'PhD Computer Science, University of Ghana (2012)',
    yearsExperience: 12,
    skills: ['JavaScript', 'Python', 'System Design', 'Leadership', 'Cloud Architecture'],
    industries: ['Technology', 'Software Development'],
    languages: ['English', 'Twi'],
    availability: 'Weekends, Tuesday evenings',
    rating: 4.9,
    reviewCount: 47,
    careerField: 'Software Engineering',
    programme: 'Computer Science',
    isFeatured: true,
    reviews: [
      { student: 'Ama Osei', rating: 5, text: 'Dr. Asante helped me land my internship at a fintech startup. His guidance on technical interviews was invaluable.', date: '2025-11-12' },
      { student: 'Kofi Mensah', rating: 5, text: 'Excellent mentor! Clear advice on building a portfolio that stands out to recruiters.', date: '2025-10-28' }
    ]
  },
  {
    id: 'm2',
    name: 'Abena Darko',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    company: 'Ecobank Ghana',
    position: 'Vice President, Corporate Banking',
    biography: 'Finance professional with expertise in corporate banking and investment. Dedicated to mentoring business students aspiring to careers in banking and finance.',
    education: 'MBA Finance, University of Ghana Business School (2010)',
    yearsExperience: 15,
    skills: ['Financial Analysis', 'Corporate Banking', 'Investment', 'Networking', 'Leadership'],
    industries: ['Banking', 'Finance'],
    languages: ['English', 'Ga'],
    availability: 'Wednesday afternoons, Saturday mornings',
    rating: 4.8,
    reviewCount: 38,
    careerField: 'Banking & Finance',
    programme: 'Business Administration',
    isFeatured: true,
    reviews: [
      { student: 'Yaw Boateng', rating: 5, text: 'Abena connected me with industry professionals and helped refine my career goals in investment banking.', date: '2025-12-01' }
    ]
  },
  {
    id: 'm3',
    name: 'Prof. Efua Mensah',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
    company: 'University of Ghana Medical School',
    position: 'Associate Professor of Medicine',
    biography: 'Practicing physician and educator guiding pre-med and medical students through academic challenges, residency applications, and clinical career paths.',
    education: 'MD, University of Ghana; Fellowship in Internal Medicine',
    yearsExperience: 18,
    skills: ['Clinical Medicine', 'Research', 'Academic Writing', 'Patient Care', 'Mentorship'],
    industries: ['Healthcare', 'Education'],
    languages: ['English', 'Ewe'],
    availability: 'Friday afternoons',
    rating: 4.9,
    reviewCount: 52,
    careerField: 'Medicine',
    programme: 'Medicine & Surgery',
    isFeatured: true,
    reviews: [
      { student: 'Adwoa Nyarko', rating: 5, text: 'Prof. Mensah guided me through my research proposal and clinical rotations planning.', date: '2025-09-15' }
    ]
  },
  {
    id: 'm4',
    name: 'Samuel Tetteh',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    company: 'MTN Ghana',
    position: 'Head of Digital Marketing',
    biography: 'Marketing strategist with experience building digital campaigns across West Africa. Helps students break into marketing, communications, and brand management.',
    education: 'BSc Marketing, University of Ghana (2011)',
    yearsExperience: 13,
    skills: ['Digital Marketing', 'Brand Strategy', 'Social Media', 'Analytics', 'Content Creation'],
    industries: ['Telecommunications', 'Marketing'],
    languages: ['English', 'Twi', 'Hausa'],
    availability: 'Monday evenings, Thursday evenings',
    rating: 4.7,
    reviewCount: 31,
    careerField: 'Marketing',
    programme: 'Marketing',
    isFeatured: false,
    reviews: []
  },
  {
    id: 'm5',
    name: 'Grace Akoto',
    photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop',
    company: 'Andela Ghana',
    position: 'Engineering Manager',
    biography: 'Full-stack engineer turned engineering leader. Focuses on helping CS and IT students develop technical skills and prepare for remote work opportunities.',
    education: 'BSc Information Technology, University of Ghana (2014)',
    yearsExperience: 10,
    skills: ['React', 'Node.js', 'Team Leadership', 'Agile', 'Technical Interviews'],
    industries: ['Technology', 'Remote Work'],
    languages: ['English'],
    availability: 'Tuesday and Thursday evenings',
    rating: 4.8,
    reviewCount: 44,
    careerField: 'Software Engineering',
    programme: 'Information Technology',
    isFeatured: true,
    reviews: [
      { student: 'Daniel Owusu', rating: 5, text: 'Grace helped me prepare for Andela\'s technical assessment. Got in on my first try!', date: '2025-11-20' }
    ]
  },
  {
    id: 'm6',
    name: 'Nana Ama Serwaa',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    company: 'Ghana Legal Associates',
    position: 'Senior Partner',
    biography: 'Corporate lawyer specializing in commercial law and intellectual property. Mentors law students on career paths in private practice and corporate legal departments.',
    education: 'LLB, University of Ghana School of Law (2008)',
    yearsExperience: 16,
    skills: ['Corporate Law', 'Legal Research', 'Negotiation', 'Contract Drafting', 'Career Guidance'],
    industries: ['Legal', 'Corporate'],
    languages: ['English', 'Twi'],
    availability: 'Saturday afternoons',
    rating: 4.9,
    reviewCount: 29,
    careerField: 'Law',
    programme: 'Law',
    isFeatured: false,
    reviews: []
  },
  {
    id: 'm7',
    name: 'Michael Adom',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    company: 'Voltic Ghana',
    position: 'Supply Chain Director',
    biography: 'Operations and supply chain expert with experience in FMCG across West Africa. Guides engineering and business students interested in operations management.',
    education: 'BSc Mechanical Engineering, KNUST; MBA Operations, UGBS',
    yearsExperience: 14,
    skills: ['Supply Chain', 'Operations', 'Project Management', 'Lean Six Sigma', 'Leadership'],
    industries: ['Manufacturing', 'FMCG'],
    languages: ['English', 'Twi'],
    availability: 'Wednesday evenings',
    rating: 4.6,
    reviewCount: 22,
    careerField: 'Operations',
    programme: 'Mechanical Engineering',
    isFeatured: false,
    reviews: []
  },
  {
    id: 'm8',
    name: 'Dr. Akosua Frimpong',
    photo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop',
    company: 'World Bank Ghana Office',
    position: 'Economist',
    biography: 'Development economist working on education and youth employment projects. Mentors economics and development studies students on research and policy careers.',
    education: 'PhD Economics, University of Ghana (2015)',
    yearsExperience: 11,
    skills: ['Econometrics', 'Policy Analysis', 'Research Methods', 'Data Analysis', 'Academic Writing'],
    industries: ['Development', 'Public Policy'],
    languages: ['English', 'French'],
    availability: 'Friday mornings, Sunday afternoons',
    rating: 4.8,
    reviewCount: 35,
    careerField: 'Economics',
    programme: 'Economics',
    isFeatured: true,
    reviews: []
  }
];

const resources = [
  {
    id: 'r1',
    title: 'Professional Resume Template for UG Students',
    category: 'Resume',
    description: 'A tailored resume template designed for University of Ghana students applying to internships and graduate programmes.',
    icon: 'file-text',
    readTime: '15 min',
    type: 'template'
  },
  {
    id: 'r2',
    title: 'Ace Your Technical Interview',
    category: 'Interview',
    description: 'Comprehensive guide covering coding challenges, system design basics, and behavioural questions for tech roles in Ghana and abroad.',
    icon: 'code',
    readTime: '25 min',
    type: 'guide'
  },
  {
    id: 'r3',
    title: 'Career Roadmap: From Campus to Corporate',
    category: 'Career Roadmap',
    description: 'Step-by-step career planning guide from first year through graduation, with milestones for each academic level.',
    icon: 'map',
    readTime: '20 min',
    type: 'guide'
  },
  {
    id: 'r4',
    title: 'Networking in Accra\'s Professional Scene',
    category: 'Networking',
    description: 'Practical tips for building professional connections at UG career fairs, LinkedIn, and industry events in Accra.',
    icon: 'users',
    readTime: '12 min',
    type: 'guide'
  },
  {
    id: 'r5',
    title: 'Internship Success Guide',
    category: 'Internship',
    description: 'How to find, apply for, and excel in internships at top Ghanaian companies and international organizations.',
    icon: 'briefcase',
    readTime: '18 min',
    type: 'guide'
  },
  {
    id: 'r6',
    title: 'SMART Goal Planner for Students',
    category: 'Goal Planner',
    description: 'Interactive framework for setting and tracking academic, career, and personal development goals throughout your university journey.',
    icon: 'target',
    readTime: '10 min',
    type: 'tool'
  }
];

const testimonials = [
  {
    name: 'Ama Osei',
    programme: 'BSc Computer Science, Level 300',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    text: 'MentorBridge connected me with a Google engineer who helped me prepare for technical interviews. I secured a summer internship at a leading fintech company in Accra.',
    rating: 5
  },
  {
    name: 'Kofi Mensah',
    programme: 'BSc Business Administration, Level 400',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    text: 'The AI matching feature recommended mentors aligned with my interest in investment banking. My mentor at Ecobank opened doors I never thought possible.',
    rating: 5
  },
  {
    name: 'Adwoa Nyarko',
    programme: 'MBChB Medicine, Level 500',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    text: 'As a medical student, finding the right mentor was challenging until MentorBridge. Prof. Mensah guided my research and helped me publish my first paper.',
    rating: 5
  }
];

const faqs = [
  {
    question: 'Who can use MentorBridge?',
    answer: 'MentorBridge is designed for University of Ghana students seeking mentorship, as well as alumni and industry professionals who wish to mentor students.'
  },
  {
    question: 'How does AI mentor matching work?',
    answer: 'Our matching algorithm analyses your academic programme, skills, interests, career goals, and level of study to recommend mentors with the highest compatibility score.'
  },
  {
    question: 'Is MentorBridge free for students?',
    answer: 'Yes, MentorBridge is completely free for University of Ghana students. Mentors volunteer their time to support the next generation of professionals.'
  },
  {
    question: 'How do I request a mentorship session?',
    answer: 'Browse the mentor directory, view mentor profiles, and click "Request Mentorship." Your request will be sent to the mentor for approval.'
  },
  {
    question: 'Can I change mentors?',
    answer: 'Yes, you can connect with multiple mentors and request sessions with different mentors based on your evolving needs and interests.'
  },
  {
    question: 'How are mentors verified?',
    answer: 'All mentors undergo a verification process by our admin team. We verify their professional credentials, LinkedIn profiles, and University of Ghana affiliation.'
  }
];

const stats = {
  students: 2847,
  mentors: 156,
  sessions: 4320,
  satisfaction: 96
};

const students = [
  { id: 's1', name: 'Ama Osei', programme: 'Computer Science', level: 'Level 300', skills: ['JavaScript', 'Python', 'React'], interests: ['Software Engineering', 'Startups'], careerGoals: ['Full-stack Developer', 'Tech Lead'], careerField: 'Software Engineering' },
  { id: 's2', name: 'Kofi Mensah', programme: 'Business Administration', level: 'Level 400', skills: ['Financial Analysis', 'Excel', 'Presentation'], interests: ['Investment Banking', 'Finance'], careerGoals: ['Investment Analyst', 'Portfolio Manager'], careerField: 'Banking & Finance' }
];

const mentorshipRequests = [
  { id: 'req1', studentId: 's1', studentName: 'Ama Osei', mentorId: 'm1', mentorName: 'Dr. Kwame Asante', status: 'pending', message: 'I would like guidance on preparing for software engineering internships.', date: '2026-01-15' },
  { id: 'req2', studentId: 's2', studentName: 'Kofi Mensah', mentorId: 'm2', mentorName: 'Abena Darko', status: 'accepted', message: 'Seeking advice on breaking into corporate banking.', date: '2026-01-10' }
];

const sessions = [
  { id: 'sess1', studentId: 's1', mentorId: 'm5', mentorName: 'Grace Akoto', title: 'Technical Interview Prep', date: '2026-02-05', time: '18:00', status: 'upcoming' },
  { id: 'sess2', studentId: 's1', mentorId: 'm1', mentorName: 'Dr. Kwame Asante', title: 'Career Path Discussion', date: '2026-01-28', time: '17:00', status: 'completed' }
];

const notifications = [
  { id: 'n1', userId: 's1', type: 'session', title: 'Upcoming Session', message: 'Your session with Grace Akoto is tomorrow at 6:00 PM.', read: false, date: '2026-02-04' },
  { id: 'n2', userId: 's1', type: 'request', title: 'Request Accepted', message: 'Dr. Kwame Asante accepted your mentorship request.', read: false, date: '2026-02-01' },
  { id: 'n3', userId: 's1', type: 'resource', title: 'New Resource', message: 'A new interview preparation guide has been added to the Resource Centre.', read: true, date: '2026-01-25' }
];

module.exports = {
  mentors,
  resources,
  testimonials,
  faqs,
  stats,
  students,
  mentorshipRequests,
  sessions,
  notifications
};
