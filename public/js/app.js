const appState = {
  filters: {
    industry: '',
    skill: '',
    careerField: '',
    search: '',
    minExperience: '',
    minRating: ''
  }
};

const sampleStudent = {
  name: 'Amina Boateng',
  programme: 'Computer Science',
  level: 'Level 300',
  skills: ['JavaScript', 'Python', 'React'],
  interests: ['Software Engineering', 'AI', 'Technology'],
  careerGoals: ['Full-stack Developer', 'Product Designer'],
  careerField: 'Software Engineering'
};

const sampleMentorRequests = [
  { id: 'req1', mentee: 'Ama Osei', mentor: 'Dr. Kwame Asante', status: 'pending', topic: 'Internship preparation', date: '2026-03-12' },
  { id: 'req2', mentee: 'Kofi Mensah', mentor: 'Abena Darko', status: 'accepted', topic: 'Finance career mapping', date: '2026-03-05' }
];

const sampleSessions = [
  { id: 'sess1', title: 'Portfolio review with Grace Akoto', date: '2026-03-08', time: '18:00', status: 'upcoming' },
  { id: 'sess2', title: 'Career path planning with Dr. Kwame Asante', date: '2026-02-28', time: '17:00', status: 'completed' }
];

const sampleNotifications = [
  { title: 'Mentorship request approved', message: 'Your request with Dr. Kwame Asante was accepted.', date: 'Today' },
  { title: 'New resource added', message: 'Interview prep guide is now available in the Resource Centre.', date: '2 days ago' }
];

const sampleResources = [
  { title: 'Professional Resume Template for UG Students', category: 'Resume', description: 'Tailored resume layout for applications to internships and graduate roles.', readTime: '5 min', link: './pages/resource-centre.html' },
  { title: 'Ace Your Technical Interview', category: 'Interview', description: 'Prepare for coding challenges and behavioural interviews with confidence.', readTime: '8 min', link: './pages/resource-centre.html' },
  { title: 'Career Roadmap: From Campus to Corporate', category: 'Career Roadmap', description: 'Plan each year of university with milestones for growth and networking.', readTime: '10 min', link: './pages/resource-centre.html' }
];

function initPage() {
  const page = document.body.dataset.page;
  ThemeManager.init();
  setupNavigation();
  setupBackToTop();
  setupFaqs();
  setupModals();
  GlobalSearch.init();
  
  // Initialize Firebase auth and update UI accordingly
  initializeFirebaseForPage();
  
  // Page-specific initialization
  if (page === 'home') initHome();
  if (page === 'mentor-directory') initDirectory();
  if (page === 'mentor-profile') initMentorProfile();
  if (page === 'resource-centre') initResourceCentre();
  if (page === 'login') initLogin();
  if (page === 'register') initRegister();
  if (page === 'student-dashboard') initStudentDashboard();
  if (page === 'mentor-dashboard') initMentorDashboard();
  if (page === 'admin-dashboard') initAdminDashboard();
  if (page === 'notifications') initNotifications();
  if (page === 'settings') initSettings();
  if (page === 'student-profile') initStudentProfile();
}

async function initializeFirebaseForPage() {
  try {
    // Initialize Firebase if available (may not be available on all pages)
    if (typeof initializeFirebaseConfig !== 'undefined') {
      await initializeFirebaseConfig();
      
      if (window.mentorBridgeAuth) {
        await window.mentorBridgeAuth.initialize();
        
        // Update user menu when auth state changes
        window.mentorBridgeAuth.onAuthStateChanged(() => {
          injectUserMenu();
        });
        
        // Initial user menu injection
        injectUserMenu();
      }
    }
  } catch (error) {
    console.warn('Firebase initialization failed on this page:', error.message);
    // Page can still function without Firebase on pages that don't require auth
  }
}

/** Wire up all modal open/close behaviour across any page */
function setupModals() {
  // Open via data-open-modal attribute (buttons/links)
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-open-modal]');
    if (trigger) {
      const modalId = trigger.dataset.openModal;
      const modal = document.getElementById(modalId);
      if (modal) { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
    }
    // Close via .modal-close button
    const closeBtn = e.target.closest('.modal-close');
    if (closeBtn) {
      const modal = closeBtn.closest('.modal-backdrop');
      if (modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
    }
    // Close via backdrop click
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });
  // Close via Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(m => {
        m.classList.add('hidden');
        document.body.style.overflow = '';
      });
    }
  });
}

/**
 * Injects a user profile dropdown into the navbar nav-actions area.
 * Uses Firebase authentication state. Replaces Log in / Register CTAs when logged in.
 */
function injectUserMenu() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  // Check Firebase authentication state
  let currentUser = null;
  let userProfile = null;
  
  if (window.mentorBridgeAuth && window.mentorBridgeAuth.isAuthenticated()) {
    currentUser = window.mentorBridgeAuth.getCurrentUser();
    userProfile = window.mentorBridgeAuth.getUserProfile();
  }

  if (!currentUser || !userProfile) return; // not logged in — keep default Log in / Register buttons

  // Remove Log in / Register links
  navActions.querySelectorAll('a').forEach(a => {
    if (a.href.includes('login') || a.href.includes('auth')) a.remove();
  });

  const initials = userProfile.name
    ? userProfile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const dashUrl = userProfile.role === 'mentor'
    ? (navActions.closest('[data-page]') ? '../pages/mentor-dashboard.html' : 'pages/mentor-dashboard.html')
    : (userProfile.role === 'admin' ? (navActions.closest('[data-page]') ? '../pages/admin-dashboard.html' : 'pages/admin-dashboard.html') : (navActions.closest('[data-page]') ? '../pages/student-dashboard.html' : 'pages/student-dashboard.html'));

  const profileUrl = userProfile.role === 'mentor' ? dashUrl : (navActions.closest('[data-page]') ? '../pages/student-profile.html' : 'pages/student-profile.html');
  const notifUrl = navActions.closest('[data-page]') ? '../pages/notifications.html' : 'pages/notifications.html';
  const settingsUrl = navActions.closest('[data-page]') ? '../pages/settings.html' : 'pages/settings.html';

  const menu = document.createElement('div');
  menu.className = 'user-menu';
  menu.innerHTML = `
    <button class="user-menu-trigger" type="button" aria-haspopup="true" aria-expanded="false">
      <div class="user-avatar-initials" aria-hidden="true">${initials}</div>
      <span class="user-menu-name">${userProfile.name || 'My Account'}</span>
      <span class="user-menu-caret" aria-hidden="true">▾</span>
    </button>
    <div class="user-dropdown" role="menu">
      <div class="user-dropdown-header">
        <strong>${userProfile.name || 'User'}</strong>
        <span>${currentUser.email || ''}</span>
      </div>
      <div class="user-dropdown-links">
        <a class="user-dropdown-link" href="${dashUrl}" role="menuitem"><span class="link-icon">🏠</span> Dashboard</a>
        <a class="user-dropdown-link" href="${profileUrl}" role="menuitem"><span class="link-icon">👤</span> My profile</a>
        <a class="user-dropdown-link" href="${notifUrl}" role="menuitem"><span class="link-icon">🔔</span> Notifications <span class="unread-dot"></span></a>
        <a class="user-dropdown-link" href="${settingsUrl}" role="menuitem"><span class="link-icon">⚙️</span> Settings</a>
        <div class="user-dropdown-divider"></div>
        <button class="user-dropdown-link logout" type="button" id="logoutBtn" role="menuitem"><span class="link-icon">🚪</span> Log out</button>
      </div>
    </div>
  `;
  navActions.prepend(menu);

  const trigger = menu.querySelector('.user-menu-trigger');
  const dropdown = menu.querySelector('.user-dropdown');
  trigger.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    trigger.setAttribute('aria-expanded', isOpen);
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) {
      menu.classList.remove('open');
      trigger.setAttribute('aria-expanded', false);
    }
  });
  menu.querySelector('#logoutBtn')?.addEventListener('click', async () => {
    try {
      await window.mentorBridgeAuth.signOut();
      window.location.href = '/pages/auth.html';
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback to clearing session and redirecting
      window.location.href = '/pages/auth.html';
    }
  });
}

function showDemoBanner() {
  // Demo banner removed - using real Firebase authentication
  return;
}

function setupNavigation() {
  const menuToggle = document.getElementById('menuToggle');
  const menu = document.getElementById('navLinks');
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', open);
    });
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => menu.classList.remove('open'));
    });
  }
}

function setupBackToTop() {
  const button = document.getElementById('backToTop');
  if (!button) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) button.classList.add('visible');
    else button.classList.remove('visible');
  });
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initHome() {
  initHeroMatchSimulator();
  initBentoGridInteractivity();
  renderFeaturedMentors();
  renderAiRecommendations();
  renderCareerResources();
  setupAnimatedCounters();
  populateStats();
  renderTestimonials();
  bindContactForm();
  bindNewsletterForm();
}

/* ─── Hero Match Simulator ─────────────────────────────────────────── */

function initHeroMatchSimulator() {
  const fieldSelect = document.getElementById('heroFieldSelect');
  const goalSelect = document.getElementById('heroGoalSelect');
  const card = document.getElementById('hmwMatchCard');
  if (!fieldSelect || !goalSelect || !card) return;

  const mentorsData = {
    cs: {
      name: 'Dr. Kwame Asante',
      role: 'Staff Software Engineer • Google Ghana',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      speed: '⚡ Responds in < 2 hrs',
      tags: {
        interview: ['Algorithms', 'System Design', 'FAANG Mock Interviews'],
        cv: ['Tech CV Review', 'GitHub Portfolio', 'STAR Method'],
        internship: ['Google STEP Prep', 'Tech Internships', 'Coding Tests'],
        grad: ['MIT & Stanford Grad', 'Research Statement', 'CS GRE']
      },
      baseScore: 98
    },
    business: {
      name: 'Abena Darko',
      role: 'VP Corporate Finance • Stanbic Bank',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
      speed: '⚡ Responds in < 4 hrs',
      tags: {
        interview: ['Valuation Mocks', 'Case Studies', 'Fit Questions'],
        cv: ['Investment Banking CV', 'Deal Sheet', 'Financial Modeling'],
        internship: ['Big 4 Consulting', 'Bank Analyst Roles', 'Networking'],
        grad: ['Harvard MBA Prep', 'GMAT Strategy', 'Scholarships']
      },
      baseScore: 97
    },
    engineering: {
      name: 'Ing. Emmanuel Tetteh',
      role: 'Chief Power Systems Engineer • VRA',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      speed: '⚡ Responds in < 8 hrs',
      tags: {
        interview: ['Technical Design', 'Safety Standards', 'PE Questions'],
        cv: ['Engineering Portfolio', 'CAD/Revit Projects', 'Certifications'],
        internship: ['Grid Engineering', 'Mining & Oil', 'Site Roles'],
        grad: ['MSc Electrical Eng', 'Erasmus Mundus', 'German DAAD']
      },
      baseScore: 95
    },
    law: {
      name: 'Nana Yaa Serwaa',
      role: 'Senior Associate • Bentsi-Enchill & Letsa',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      speed: '⚡ Responds in < 6 hrs',
      tags: {
        interview: ['Case Prep', 'Moot Court', 'Partner Interviews'],
        cv: ['Law Review CV', 'Writing Samples', 'Judicial Clerkship'],
        internship: ['Top Tier Law Firms', 'NGO Legal Intern', 'In-House'],
        grad: ['Oxford BCL / Harvard LLM', 'Bar Exam Tactics', 'Personal Essay']
      },
      baseScore: 99
    },
    health: {
      name: 'Dr. Kofi Mensah',
      role: 'Clinical Specialist • Korle-Bu Hospital',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      speed: '⚡ Responds in < 12 hrs',
      tags: {
        interview: ['MMI Prep', 'Clinical Scenarios', 'Ethics Questions'],
        cv: ['Medical CV Format', 'Research Publications', 'Volunteering'],
        internship: ['Housemanship Advice', 'Public Health NGO', 'Lab Rotation'],
        grad: ['Residency Match (US/UK)', 'PLAB/USMLE', 'MPH Programs']
      },
      baseScore: 94
    }
  };

  function updateMatch() {
    const field = fieldSelect.value;
    const goal = goalSelect.value;
    const mentor = mentorsData[field] || mentorsData.cs;

    card.style.opacity = '0.4';
    card.style.transform = 'scale(0.97)';

    setTimeout(() => {
      const avatarEl = document.getElementById('hmwAvatar');
      const nameEl = document.getElementById('hmwName');
      const roleEl = document.getElementById('hmwRole');
      const speedEl = document.getElementById('hmwSpeed');
      const scoreEl = document.getElementById('hmwScore');
      const tagsContainer = document.getElementById('hmwTags');

      if (avatarEl) { avatarEl.src = mentor.avatar; avatarEl.alt = mentor.name; }
      if (nameEl) nameEl.textContent = mentor.name;
      if (roleEl) roleEl.textContent = mentor.role;
      if (speedEl) speedEl.textContent = mentor.speed;

      const scoreVariance = (field.charCodeAt(0) + goal.charCodeAt(0)) % 5;
      const score = Math.min(99, Math.max(92, mentor.baseScore - scoreVariance));
      if (scoreEl) scoreEl.textContent = `${score}%`;

      if (tagsContainer) {
        const tagList = mentor.tags[goal] || mentor.tags.interview;
        tagsContainer.innerHTML = tagList.map(t => `<span class="hmw-tag">${t}</span>`).join('');
      }

      card.style.opacity = '1';
      card.style.transform = 'scale(1)';
    }, 150);
  }

  fieldSelect.addEventListener('change', updateMatch);
  goalSelect.addEventListener('change', updateMatch);
}

/* ─── Bento Grid Slot Selector ─────────────────────────────────────── */

function initBentoGridInteractivity() {
  const slotGroup = document.getElementById('bentoSlotGroup');
  if (!slotGroup) return;

  slotGroup.addEventListener('click', (e) => {
    const chip = e.target.closest('.bento-slot-chip');
    if (!chip) return;
    slotGroup.querySelectorAll('.bento-slot-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
  });
}

/* ─── Animated Counters ────────────────────────────────────────────── */

function setupAnimatedCounters() {
  const statsSection = document.getElementById('stats');
  if (!statsSection) return;

  const counterEls = statsSection.querySelectorAll('[data-counter-target]');
  if (!counterEls.length) return;

  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        counterEls.forEach(el => {
          const target = parseInt(el.getAttribute('data-counter-target'), 10);
          const suffix = el.getAttribute('data-counter-suffix') || '';
          if (isNaN(target)) return;

          const duration = 1800; // ms
          const startTime = performance.now();

          function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easeOut * target);

            el.textContent = currentVal.toLocaleString() + suffix;

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              el.textContent = target.toLocaleString() + suffix;
            }
          }

          requestAnimationFrame(step);
        });
      }
    });
  }, { threshold: 0.25 });

  observer.observe(statsSection);
}

/* ─── Stats ────────────────────────────────────────────────────────── */

function populateStats() {
  const FALLBACK = { students: 2847, mentors: 156, sessions: 4210, satisfaction: 96 };

  function applyStats(values) {
    const el = id => document.getElementById(id);
    if (el('stat-students')) el('stat-students').setAttribute('data-counter-target', values.students);
    if (el('stat-mentors'))  el('stat-mentors').setAttribute('data-counter-target', values.mentors);
    if (el('stat-sessions')) el('stat-sessions').setAttribute('data-counter-target', values.sessions);
    if (el('stat-rating'))   el('stat-rating').setAttribute('data-counter-target', values.satisfaction);
  }

  fetch('/api/analytics/dashboard')
    .then(res => res.json())
    .then(data => {
      const stats = data.stats || {};
      applyStats({
        students:     stats.students || FALLBACK.students,
        mentors:      stats.mentors || FALLBACK.mentors,
        sessions:     stats.sessions || FALLBACK.sessions,
        satisfaction: stats.satisfaction || FALLBACK.satisfaction
      });
    })
    .catch(() => applyStats(FALLBACK));
}

/* ─── Testimonials carousel ────────────────────────────────────────── */

function renderTestimonials() {
  const section = document.getElementById('testimonials');
  if (!section) return;

  let current = 0;
  let testimonials = [];
  const grid = document.getElementById('testimonialGrid') || section.querySelector('.testimonial-grid');
  if (!grid) return;

  // Fetch testimonials from database
  fetch('/api/testimonials')
    .then(res => res.json())
    .then(data => {
      testimonials = data.testimonials || [];
      if (testimonials.length === 0) {
        // Fallback to hardcoded testimonials if database is empty
        testimonials = [
          {
            text: 'MentorBridge connected me with a Google engineer who helped me prepare for technical interviews. I landed my internship within two months.',
            name: 'Ama Osei',
            programme: 'Computer Science Graduate',
            photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
          },
          {
            text: 'The AI matching feature recommended mentors perfectly aligned with my interest in investment banking. My mentor helped me secure a role at Ecobank.',
            name: 'Kofi Mensah',
            programme: 'Business Administration',
            photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
          },
          {
            text: 'Prof. Mensah guided my research and helped me publish my first academic paper before graduating.',
            name: 'Adwoa Nyarko',
            programme: 'Medicine — Career Changer',
            photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
          }
        ];
      }
      showTestimonials();
    })
    .catch(() => {
      // Fallback to hardcoded testimonials if API fails
      testimonials = [
        {
          text: 'MentorBridge connected me with a Google engineer who helped me prepare for technical interviews. I landed my internship within two months.',
          name: 'Ama Osei',
          programme: 'Computer Science Graduate',
          photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
        },
        {
          text: 'The AI matching feature recommended mentors perfectly aligned with my interest in investment banking. My mentor helped me secure a role at Ecobank.',
          name: 'Kofi Mensah',
          programme: 'Business Administration',
          photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
        },
        {
          text: 'Prof. Mensah guided my research and helped me publish my first academic paper before graduating.',
          name: 'Adwoa Nyarko',
          programme: 'Medicine — Career Changer',
          photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
        }
      ];
      showTestimonials();
    });

  function showTestimonials() {
    if (testimonials.length === 0) return;
    const visible = testimonials.slice(current, current + 3);
    if (visible.length === 0 && current > 0) {
      current = 0; // wrap to beginning
      return showTestimonials();
    }
    grid.innerHTML = visible.map(t => `
      <article class="testimonial-card">
        <div class="testimonial-content">
          <p>${t.text}</p>
        </div>
        <div class="testimonial-author">
          <img src="${t.photo}" alt="${t.name}" loading="lazy" />
          <div>
            <strong>${t.name}</strong>
            <span>${t.programme}</span>
          </div>
        </div>
      </article>
    `).join('');
  }

  const prevBtn = section.querySelector('.testimonial-prev');
  const nextBtn = section.querySelector('.testimonial-next');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    current = Math.max(0, current - 1);
    showTestimonials();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    current = Math.min(testimonials.length - 3, current + 1);
    showTestimonials();
  });
}

/* ─── Contact form ─────────────────────────────────────────────────── */

function bindContactForm() {
  const form = document.getElementById('contactForm');
  const feedback = document.getElementById('contact-feedback');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = form.querySelector('#contactName')?.value.trim();
    const email   = form.querySelector('#contactEmail')?.value.trim();
    const message = form.querySelector('#contactMessage')?.value.trim();

    if (!name || !email || !message) {
      if (feedback) {
        feedback.textContent = 'Please fill in all fields before sending.';
        feedback.className = 'form-feedback form-feedback--error';
      }
      return;
    }

    if (feedback) {
      feedback.textContent = 'Thank you! Your message has been sent. We will get back to you within 24 hours.';
      feedback.className = 'form-feedback form-feedback--success';
    }
    form.reset();
  });
}

/* ─── Newsletter form ──────────────────────────────────────────────── */

function bindNewsletterForm() {
  const form     = document.getElementById('newsletterForm');
  const feedback = document.getElementById('newsletter-feedback');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.querySelector('#newsletterEmail')?.value.trim();

    if (!email) {
      if (feedback) {
        feedback.textContent = 'Please enter your email address.';
        feedback.className = 'form-feedback form-feedback--error';
      }
      return;
    }

    if (feedback) {
      feedback.textContent = 'You are subscribed! Expect mentorship news, career tips, and event alerts in your inbox.';
      feedback.className = 'form-feedback form-feedback--success';
    }
    form.reset();
  });
}

function renderFeaturedMentors() {
  const containers = document.querySelectorAll('.featured-mentor-placeholder');
  if (!containers.length) return;
  fetch('/api/mentors?featured=true')
    .then(res => res.json())
    .then(data => {
      const html = data.mentors.map(renderMentorCard).join('');
      containers.forEach(container => {
        container.innerHTML = html;
      });
    })
    .catch(() => {
      containers.forEach(container => {
        container.innerHTML = '<p class="section-text">Unable to load mentors right now. Please try again later.</p>';
      });
    });
}

/**
 * Pure function — renders a mentor card HTML string.
 * Exported via window.MentorBridge for testability.
 * @param {object} mentor
 * @returns {string} HTML string
 */
function renderMentorCard(mentor) {
  const topSkills = (mentor.skills || []).slice(0, 3);
  return `
    <article class="mentor-card">
      <div class="mentor-card-img">
        <img src="${mentor.photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=200&fit=crop'}" alt="${mentor.name}" loading="lazy" />
      </div>
      <div class="mentor-card-body">
        <div class="mentor-card-top">
          <img class="mentor-avatar" src="${mentor.photo || ''}" alt="${mentor.name}" loading="lazy" />
          <div class="mentor-info">
            <h3>${mentor.name}</h3>
            <p>${mentor.position} at ${mentor.company}</p>
            <div class="mentor-meta">
              ${mentor.yearsExperience != null ? `<span class="badge badge-secondary">${mentor.yearsExperience}+ yrs</span>` : ''}
              <span class="badge badge-accent">${mentor.rating} ★</span>
              <span class="badge badge-primary">${mentor.careerField || ''}</span>
            </div>
          </div>
        </div>
        <div class="tag-list">
          ${topSkills.map(skill => `<span class="tag-pill">${skill}</span>`).join('')}
        </div>
        <div class="section-actions">
          <a class="btn btn-outline" href="/pages/mentor-profile.html?id=${mentor.id}" aria-label="View ${mentor.name}'s profile">View profile</a>
        </div>
      </div>
    </article>
  `;
}

/**
 * Pure function — renders a resource card HTML string.
 * Exported via window.MentorBridge for testability.
 * @param {object} resource
 * @returns {string} HTML string
 */
function renderResourceCard(resource) {
  const modalMap = { 'r1': 'modal-resume', 'r2': 'modal-interview', 'r3': 'modal-roadmap', 'r4': 'modal-networking', 'r5': 'modal-internship', 'r6': 'modal-goals' };
  const modalId = modalMap[resource.id] || null;
  const viewBtn = modalId
    ? `<button class="btn btn-outline btn-sm" data-open-modal="${modalId}" aria-label="Open ${resource.title}">View →</button>`
    : `<a class="btn btn-outline btn-sm" href="resource-centre.html" aria-label="Open ${resource.title}">View →</a>`;
  return `
    <article class="resource-card">
      <span class="badge badge-accent">${resource.category}</span>
      <h3>${resource.title}</h3>
      <p>${resource.description}</p>
      <div class="resource-meta">
        <span class="text-sm">${resource.readTime || ''} read</span>
        ${viewBtn}
      </div>
    </article>
  `;
}

function renderAiRecommendations() {
  const containers = document.querySelectorAll('.ai-recommendation-placeholder');
  if (!containers.length) return;
  fetch('/api/matching/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sampleStudent)
  })
    .then(res => res.json())
    .then(data => {
      const html = data.recommendations.map(mentor => `
        <article class="ai-result">
          <div class="mentor-card-top">
            <img class="mentor-avatar" src="${mentor.photo}" alt="${mentor.name}" />
            <div class="mentor-info">
              <h4>${mentor.name}</h4>
              <p>${mentor.position} at ${mentor.company}</p>
            </div>
          </div>
          <p>${mentor.matchReasons.join(' · ')}</p>
          <div class="mentor-meta">
            <span class="badge badge-success">Match ${mentor.matchScore}%</span>
          </div>
        </article>
      `).join('');
      containers.forEach(container => {
        container.innerHTML = html;
      });
    })
    .catch(() => {
      containers.forEach(container => {
        container.innerHTML = '<p class="section-text">Unable to load AI matches right now.</p>';
      });
    });
}

function renderCareerResources(containerId = 'resourceHighlights') {
  const container = document.getElementById(containerId);
  if (!container) return;

  fetch('/api/resources')
    .then(res => res.json())
    .then(data => {
      const resources = (data.resources || sampleResources).slice(0, 3);
      container.innerHTML = resources.map(renderResourceCard).join('');
    })
    .catch(() => {
      container.innerHTML = sampleResources.slice(0, 3).map(renderResourceCard).join('');
    });
}

function initDirectory() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('industry')) appState.filters.industry = params.get('industry');
  loadFilters();
  loadMentors();
  const searchInput = document.getElementById('directorySearch');
  const filterForm = document.getElementById('directoryFilters');
  if (searchInput) {
    searchInput.addEventListener('input', event => {
      appState.filters.search = event.target.value;
      loadMentors();
    });
  }
  if (filterForm) {
    filterForm.addEventListener('change', () => {
      appState.filters.industry = document.getElementById('filterIndustry')?.value || '';
      appState.filters.skill = document.getElementById('filterSkill')?.value || '';
      appState.filters.careerField = document.getElementById('filterCareerField')?.value || '';
      appState.filters.minExperience = document.getElementById('filterExperience')?.value || '';
      appState.filters.minRating = document.getElementById('filterRating')?.value || '';
      loadMentors();
    });
  }
}

function loadFilters() {
  fetch('/api/mentors/filters')
    .then(res => res.json())
    .then(data => {
      const industrySelect = document.getElementById('filterIndustry');
      const skillSelect = document.getElementById('filterSkill');
      const careerFieldSelect = document.getElementById('filterCareerField');
      if (industrySelect) industrySelect.innerHTML = `<option value="">All industries</option>${data.industries.map(item => `<option value="${item}">${item}</option>`).join('')}`;
      if (skillSelect) skillSelect.innerHTML = `<option value="">All skills</option>${data.skills.map(item => `<option value="${item}">${item}</option>`).join('')}`;
      if (careerFieldSelect) careerFieldSelect.innerHTML = `<option value="">All career fields</option>${data.careerFields.map(item => `<option value="${item}">${item}</option>`).join('')}`;
    })
    .catch(() => {});
}

function loadMentors() {
  const container = document.getElementById('mentorDirectoryList');
  const params = new URLSearchParams();
  Object.entries(appState.filters).forEach(([key, value]) => { if (value) params.set(key, value); });
  fetch(`/api/mentors?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      if (!container) return;
      container.innerHTML = data.mentors.length ? data.mentors.map(renderMentorCardFull).join('') : '<p>No mentors matched your filters.</p>';
    })
    .catch(() => {
      if (container) container.innerHTML = '<p>Unable to load mentor directory at the moment.</p>';
    });
}

function renderMentorCardFull(mentor) {
  return `
    <article class="mentor-card">
      <div class="mentor-card-top">
        <img class="mentor-avatar" src="${mentor.photo}" alt="${mentor.name}" />
        <div class="mentor-info">
          <h3>${mentor.name}</h3>
          <p>${mentor.position} at ${mentor.company}</p>
          <div class="mentor-meta">
            <span class="badge badge-secondary">${mentor.careerField}</span>
            <span class="badge badge-accent">${mentor.availability}</span>
          </div>
        </div>
      </div>
      <p>${mentor.biography}</p>
      <div class="badge-list">
        ${mentor.skills.slice(0, 4).map(skill => `<span class="badge badge-primary">${skill}</span>`).join('')}
      </div>
      <div class="section-actions" style="margin-top: var(--spacing-md);">
        <a class="btn btn-secondary" href="/pages/mentor-profile.html?id=${mentor.id}">Request mentorship</a>
      </div>
    </article>
  `;
}

function initMentorProfile() {
  const params = new URLSearchParams(window.location.search);
  const mentorId = params.get('id');
  if (!mentorId) return;
  fetch(`/api/mentors/${mentorId}`)
    .then(res => res.json())
    .then(renderMentorProfilePage)
    .catch(() => {
      const container = document.getElementById('mentorProfileContent');
      if (container) container.innerHTML = '<p>Mentor profile could not be loaded.</p>';
    });
}

function renderMentorProfilePage(mentor) {
  const container = document.getElementById('mentorProfileContent');
  if (!container) return;

  const stars = n => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  container.innerHTML = `
    <!-- Profile Header -->
    <div class="mentor-profile-header">
      <img class="mentor-profile-photo" src="${mentor.photo}" alt="${mentor.name}" />
      <div class="mentor-profile-meta">
        <h1>${mentor.name}</h1>
        <p class="mentor-profile-role">${mentor.position} at ${mentor.company}</p>
        <div class="mentor-meta" style="gap:.5rem;margin-top:.75rem;">
          ${(mentor.industries || []).map(i => `<span class="badge badge-secondary">${i}</span>`).join('')}
          <span class="badge badge-accent">${mentor.careerField || ''}</span>
        </div>
        <div style="display:flex;align-items:center;gap:.75rem;margin-top:.75rem;">
          <span class="rating-stars">${stars(mentor.rating)}</span>
          <strong>${mentor.rating}</strong>
          <span style="color:var(--color-text-muted);font-size:var(--font-size-sm);">(${mentor.reviewCount} reviews)</span>
        </div>
        <button class="btn btn-secondary" data-open-modal="requestMentorshipModal" style="margin-top:1.25rem;" aria-label="Request mentorship from ${mentor.name}">
          Request Mentorship
        </button>
      </div>
    </div>

    <!-- Bio & Details -->
    <div class="mentor-profile-body">
      <div class="mentor-profile-main">
        <section class="dashboard-card" style="margin-bottom:1.5rem;">
          <h2>About</h2>
          <p>${mentor.biography}</p>
        </section>

        <section class="dashboard-card" style="margin-bottom:1.5rem;">
          <h2>Skills &amp; Expertise</h2>
          <div class="tag-list" style="margin-top:.75rem;">
            ${(mentor.skills || []).map(s => `<span class="tag-pill">${s}</span>`).join('')}
          </div>
        </section>

        <section class="dashboard-card" style="margin-bottom:1.5rem;">
          <h2>Reviews</h2>
          ${mentor.reviews && mentor.reviews.length
            ? mentor.reviews.map(r => `
              <div class="review-item">
                <div class="review-header">
                  <strong>${r.student}</strong>
                  <span class="rating-stars">${stars(r.rating)}</span>
                  <span style="color:var(--color-text-muted);font-size:var(--font-size-xs);">${r.date}</span>
                </div>
                <p>"${r.text}"</p>
              </div>`).join('')
            : '<p style="color:var(--color-text-muted);">No reviews yet — be the first to work with this mentor.</p>'}
        </section>
      </div>

      <aside class="mentor-profile-sidebar">
        <div class="dashboard-card" style="margin-bottom:1rem;">
          <h3>Details</h3>
          <ul class="profile-detail-list">
            <li><span>Experience</span><strong>${mentor.yearsExperience}+ years</strong></li>
            <li><span>Education</span><strong>${mentor.education}</strong></li>
            <li><span>Languages</span><strong>${(mentor.languages || []).join(', ')}</strong></li>
            <li><span>Availability</span><strong>${mentor.availability}</strong></li>
          </ul>
        </div>
        <button class="btn btn-primary" data-open-modal="requestMentorshipModal" style="width:100%;" aria-label="Request mentorship">
          Request Mentorship
        </button>
      </aside>
    </div>

    <!-- Request Mentorship Modal -->
    <div id="requestMentorshipModal" class="modal-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="reqModalTitle">
      <div class="modal-card">
        <button class="modal-close btn btn-ghost" type="button" aria-label="Close">✕</button>
        <span class="section-label">Mentorship Request</span>
        <h2 id="reqModalTitle" style="margin:.3rem 0 .5rem;">Request mentorship from ${mentor.name}</h2>
        <p style="color:var(--color-text-muted);font-size:var(--font-size-sm);margin-bottom:1.5rem;">Tell ${mentor.name.split(' ')[0]} what you're looking for and they'll get back to you within 2–3 days.</p>
        <form id="requestMentorshipForm" novalidate>
          <div class="form-group">
            <label class="form-label" for="requestReason">Reason for request</label>
            <select class="form-select" id="requestReason" aria-required="true">
              <option value="">Select a reason…</option>
              <option value="Career Advice">Career Advice</option>
              <option value="Resume Review">Resume Review</option>
              <option value="Mock Interview">Mock Interview</option>
              <option value="General Mentorship">General Mentorship</option>
              <option value="Industry Insights">Industry Insights</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="requestMessage">Your message</label>
            <textarea class="form-textarea" id="requestMessage" rows="4" placeholder="Introduce yourself and explain what you'd like to work on…" aria-required="true"></textarea>
          </div>
          <div id="requestFeedback" class="form-feedback" aria-live="polite"></div>
          <button class="btn btn-secondary" type="submit" style="width:100%;">Send Request</button>
        </form>
      </div>
    </div>
  `;

  // Wire up request form
  const form = container.querySelector('#requestMentorshipForm');
  const feedback = container.querySelector('#requestFeedback');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const reason = container.querySelector('#requestReason')?.value;
      const message = container.querySelector('#requestMessage')?.value.trim();
      if (!reason || !message) {
        if (feedback) { feedback.textContent = 'Please select a reason and write a message.'; feedback.className = 'form-feedback form-feedback--error'; }
        return;
      }
      if (feedback) {
        feedback.textContent = `Your request has been sent to ${mentor.name}. They typically respond within 2–3 days.`;
        feedback.className = 'form-feedback form-feedback--success';
      }
      form.reset();
    });
  }
}

function initResourceCentre() {
  const container = document.getElementById('resourceCentreList');
  if (!container) return;
  fetch('/api/resources')
    .then(res => res.json())
    .then(data => {
      container.innerHTML = (data.resources || []).map(renderResourceCard).join('');
    })
    .catch(() => {
      container.innerHTML = sampleResources.map(renderResourceCard).join('');
    });
}

function initLogin() {
  // Tab switching
  const tabs = document.querySelectorAll('[data-auth-tab]');
  const panels = document.querySelectorAll('[data-auth-panel]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); });
      panels.forEach(p => p.classList.add('hidden'));
      tab.classList.add('active');
      const panel = document.querySelector(`[data-auth-panel="${tab.dataset.authTab}"]`);
      if (panel) panel.classList.remove('hidden');
    });
  });

  // Show/hide password
  document.querySelectorAll('.show-password').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = document.getElementById(toggle.dataset.target);
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      toggle.textContent = isText ? 'Show password' : 'Hide password';
    });
  });

  // Forgot password modal
  const modal = document.getElementById('forgotPwModal');
  const closeBtn = modal && modal.querySelector('.modal-close');
  const forgotForm = document.getElementById('forgotPwForm');
  const fpFeedback = document.getElementById('forgotPwFeedback');

  document.querySelectorAll('.forgot-pw-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      if (modal) { modal.classList.remove('hidden'); document.getElementById('resetEmail')?.focus(); }
    });
  });
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
  if (forgotForm) {
    forgotForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('resetEmail')?.value.trim();
      if (!email) {
        if (fpFeedback) { fpFeedback.textContent = 'Please enter your email address.'; fpFeedback.className = 'form-feedback form-feedback--error'; }
        return;
      }
      if (fpFeedback) {
        fpFeedback.textContent = `If ${email} is registered, a reset link has been sent. Check your inbox.`;
        fpFeedback.className = 'form-feedback form-feedback--success';
      }
      forgotForm.reset();
    });
  }

  // Login buttons
  const loginConfigs = [
    { id: 'loginStudentButton', prefix: 'student', redirect: './student-dashboard.html', name: 'Amina Boateng' },
    { id: 'loginMentorButton',  prefix: 'mentor',  redirect: './mentor-dashboard.html',  name: 'Grace Akoto'  },
    { id: 'loginAdminButton',   prefix: 'admin',   redirect: './admin-dashboard.html',   name: 'Admin User'   }
  ];
  const loginMessage = document.getElementById('loginMessage');

  loginConfigs.forEach(({ id, prefix, redirect, name }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const email    = document.getElementById(`${prefix}Email`)?.value.trim();
      const password = document.getElementById(`${prefix}Password`)?.value;
      if (!email || !password) {
        if (loginMessage) { loginMessage.textContent = 'Please enter your email and password.'; loginMessage.style.color = 'var(--color-error)'; }
        return;
      }
      const origText = btn.textContent;
      btn.textContent = 'Signing in…';
      btn.disabled = true;
      try {
        await signInUser(email, password, prefix);
        sessionStorage.setItem('mb_session', JSON.stringify({ name, email, role: prefix }));
        if (loginMessage) { loginMessage.textContent = 'Login successful! Redirecting…'; loginMessage.style.color = 'var(--color-success)'; }
        setTimeout(() => { window.location.href = redirect; }, 800);
      } catch (error) {
        if (loginMessage) { loginMessage.textContent = error.message || 'Login failed. Please check your credentials.'; loginMessage.style.color = 'var(--color-error)'; }
        btn.textContent = origText;
        btn.disabled = false;
      }
    });
  });
}

function initRegister() {
  // Tab/role switching
  const roleButtons = document.querySelectorAll('[data-register-role]');
  const rolePanels  = document.querySelectorAll('[data-register-panel]');
  roleButtons.forEach(button => {
    button.addEventListener('click', () => {
      roleButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      rolePanels.forEach(p => p.classList.add('hidden'));
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      const panel = document.querySelector(`[data-register-panel="${button.dataset.registerRole}"]`);
      if (panel) panel.classList.remove('hidden');
    });
  });

  // Show/hide password
  document.querySelectorAll('.show-password').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = document.getElementById(toggle.dataset.target);
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      toggle.textContent = isText ? 'Show password' : 'Hide password';
    });
  });

  // Student registration
  const registerStudentButton = document.getElementById('registerStudentButton');
  const registerMentorButton  = document.getElementById('registerMentorButton');
  const registerMessage = document.getElementById('registerMessage');

  function showRegisterError(msg, elId) {
    const el = document.getElementById(elId);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
    if (registerMessage) { registerMessage.textContent = msg; registerMessage.style.color = 'var(--color-error)'; }
  }

  if (registerStudentButton) {
    registerStudentButton.addEventListener('click', async () => {
      const name     = document.getElementById('studentName')?.value.trim();
      const email    = document.getElementById('studentEmail')?.value.trim();
      const password = document.getElementById('studentPassword')?.value;
      const programme = document.getElementById('studentProgramme')?.value.trim();
      const level    = document.getElementById('studentLevel')?.value;
      const skills   = document.getElementById('studentSkills')?.value.trim();
      const interests = document.getElementById('studentInterests')?.value.trim();
      const goal     = document.getElementById('studentCareerGoal')?.value.trim();

      if (!name || !email || !password || !programme || !level || !skills || !interests || !goal) {
        showRegisterError('Please fill in all required fields.', 'register-error');
        return;
      }
      if (password.length < 6) {
        showRegisterError('Password must be at least 6 characters.', 'register-error');
        return;
      }

      const btn = registerStudentButton;
      btn.textContent = 'Creating account…';
      btn.disabled = true;

      try {
        const result = await registerUser(email, password, 'student');
        await createUserProfile(result.user, { name, role: 'student', programme, level, skills: skills.split(',').map(s => s.trim()), interests: interests.split(',').map(s => s.trim()), careerGoals: [goal], createdAt: new Date().toISOString() });
        sessionStorage.setItem('mb_session', JSON.stringify({ name, email, role: 'student' }));
        if (registerMessage) { registerMessage.textContent = 'Account created! Redirecting to your dashboard…'; registerMessage.style.color = 'var(--color-success)'; }
        setTimeout(() => { window.location.href = './student-dashboard.html'; }, 1200);
      } catch (error) {
        showRegisterError(error.message || 'Registration failed. Please try again.', 'register-error');
        btn.textContent = 'Create student account';
        btn.disabled = false;
      }
    });
  }

  // Mentor registration
  if (registerMentorButton) {
    registerMentorButton.addEventListener('click', async () => {
      const name      = document.getElementById('mentorName')?.value.trim();
      const email     = document.getElementById('mentorEmail')?.value.trim();
      const password  = document.getElementById('mentorPassword')?.value;
      const expertise = document.getElementById('mentorExpertise')?.value.trim();
      const industry  = document.getElementById('mentorIndustry')?.value.trim();
      const bio       = document.getElementById('mentorBio')?.value.trim();

      if (!name || !email || !password || !expertise || !industry || !bio) {
        showRegisterError('Please fill in all required fields.', 'register-error-mentor');
        return;
      }
      if (password.length < 6) {
        showRegisterError('Password must be at least 6 characters.', 'register-error-mentor');
        return;
      }

      const btn = registerMentorButton;
      btn.textContent = 'Creating account…';
      btn.disabled = true;

      try {
        const result = await registerUser(email, password, 'mentor');
        await createUserProfile(result.user, { name, role: 'mentor', expertise, industry, bio, createdAt: new Date().toISOString() });
        sessionStorage.setItem('mb_session', JSON.stringify({ name, email, role: 'mentor' }));
        if (registerMessage) { registerMessage.textContent = 'Mentor account created! Redirecting to your dashboard…'; registerMessage.style.color = 'var(--color-success)'; }
        setTimeout(() => { window.location.href = './mentor-dashboard.html'; }, 1200);
      } catch (error) {
        showRegisterError(error.message || 'Registration failed. Please try again.', 'register-error-mentor');
        btn.textContent = 'Create mentor account';
        btn.disabled = false;
      }
    });
  }
}

function initStudentDashboard() {
  const sessionsList = document.getElementById('studentSessions');
  const notificationsList = document.getElementById('studentNotifications');
  const savedMentors = document.getElementById('savedMentors');
  const checklist = document.getElementById('progressChecklist');
  const recentActivity = document.getElementById('recentActivity');

  // Update overview cards with real data
  updateDashboardOverview();

  // Load real sessions data
  if (sessionsList) {
    fetch('/api/sessions?menteeId=s1')
      .then(res => res.json())
      .then(data => {
        const sessions = data.sessions || [];
        sessionsList.innerHTML = sessions.length > 0 
          ? sessions.slice(0, 5).map(sess => `
            <tr>
              <td>${sess.title || sess.topic}</td>
              <td>${sess.date} at ${sess.time}</td>
              <td><span class="status-pill status-${sess.status}">${sess.status}</span></td>
            </tr>
          `).join('')
          : '<tr><td colspan="3" style="text-align:center;color:var(--color-text-muted);">No sessions yet</td></tr>';
      })
      .catch(() => {
        sessionsList.innerHTML = sampleSessions.map(sess => `
          <tr>
            <td>${sess.title}</td>
            <td>${sess.date}</td>
            <td><span class="status-pill status-${sess.status}">${sess.status}</span></td>
          </tr>
        `).join('');
      });
  }

  // Load real notifications data
  if (notificationsList) {
    fetch('/api/notifications/s1')
      .then(res => res.json())
      .then(data => {
        const notifications = data.notifications || [];
        notificationsList.innerHTML = notifications.length > 0
          ? notifications.slice(0, 3).map(note => `
            <article class="notification-card">
              <strong>${note.title}</strong>
              <p>${note.message}</p>
              <small>${note.date}</small>
            </article>
          `).join('')
          : '<p style="color:var(--color-text-muted);">No notifications yet</p>';
      })
      .catch(() => {
        notificationsList.innerHTML = sampleNotifications.slice(0, 2).map(note => `
          <article class="notification-card">
            <strong>${note.title}</strong>
            <p>${note.message}</p>
            <small>${note.date}</small>
          </article>
        `).join('');
      });
  }

  // Load progress checklist based on user data
  if (checklist) {
    Promise.all([
      fetch('/api/users/students/s1').then(res => res.json()).catch(() => null),
      fetch('/api/users/requests').then(res => res.json()).catch(() => null),
      fetch('/api/sessions?menteeId=s1').then(res => res.json()).catch(() => null)
    ]).then(([student, requests, sessions]) => {
      const hasProfile = student && student.name;
      const hasRequest = requests && requests.requests && requests.requests.length > 0;
      const hasSessions = sessions && sessions.sessions && sessions.sessions.length > 0;
      
      const items = [
        { label: 'Complete profile', done: hasProfile },
        { label: 'Request first mentorship', done: hasRequest },
        { label: 'Complete first session', done: hasSessions },
        { label: 'Explore career resources', done: false } // This would need separate tracking
      ];
      checklist.innerHTML = items.map(item => `
        <li class="checklist-item ${item.done ? 'done' : ''}">
          <span class="checklist-icon">${item.done ? '✓' : '○'}</span>${item.label}
        </li>
      `).join('');
    }).catch(() => {
      // Fallback to static checklist
      const items = [
        { label: 'Complete profile', done: true },
        { label: 'Request first mentorship', done: true },
        { label: 'Upload resume', done: false },
        { label: 'Explore career resources', done: false }
      ];
      checklist.innerHTML = items.map(item => `
        <li class="checklist-item ${item.done ? 'done' : ''}">
          <span class="checklist-icon">${item.done ? '✓' : '○'}</span>${item.label}
        </li>
      `).join('');
    });
  }

  // Load recent activity from multiple sources
  if (recentActivity) {
    Promise.all([
      fetch('/api/sessions?menteeId=s1').then(res => res.json()).catch(() => ({ sessions: [] })),
      fetch('/api/users/requests').then(res => res.json()).catch(() => ({ requests: [] }))
    ]).then(([sessionsData, requestsData]) => {
      const activities = [];
      
      // Add recent sessions
      (sessionsData.sessions || []).slice(0, 2).forEach(session => {
        activities.push({
          title: session.status === 'completed' ? 'Session completed' : 'Session scheduled',
          description: `${session.title} with ${session.mentorName}`,
          date: session.date,
          type: 'session'
        });
      });
      
      // Add recent requests
      (requestsData.requests || []).slice(0, 2).forEach(request => {
        activities.push({
          title: request.status === 'accepted' ? 'Mentorship request accepted' : 'Mentorship request sent',
          description: `${request.mentor_name || request.mentorName} - ${request.status}`,
          date: request.date,
          type: 'request'
        });
      });
      
      // Sort by date and take most recent
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      recentActivity.innerHTML = activities.length > 0
        ? activities.slice(0, 3).map(activity => `
          <article class="activity-card">
            <strong>${activity.title}</strong>
            <p>${activity.description} · ${activity.date}</p>
          </article>
        `).join('')
        : '<article class="activity-card"><strong>Welcome to MentorBridge!</strong><p>Start by exploring mentors and requesting your first session.</p></article>';
    }).catch(() => {
      // Fallback to static activity
      recentActivity.innerHTML = `
        <article class="activity-card"><strong>Welcome to MentorBridge!</strong><p>Start by exploring mentors and requesting your first session.</p></article>
        <article class="activity-card"><strong>Profile created</strong><p>You joined the MentorBridge community · Welcome!</p></article>
      `;
    });
  }

  // Load suggested mentors (replace saved mentors concept)
  if (savedMentors) {
    fetch('/api/mentors?featured=true&limit=2')
      .then(res => res.json())
      .then(data => {
        savedMentors.innerHTML = (data.mentors || []).slice(0, 2).map(m => `
          <article class="mentor-card">
            <div class="mentor-card-top">
              <img class="mentor-avatar avatar-sm" src="${m.photo}" alt="${m.name}" />
              <div><h4>${m.name}</h4><p>${m.company}</p></div>
            </div>
            <a class="btn btn-ghost btn-sm" href="/pages/mentor-profile.html?id=${m.id}">View profile</a>
          </article>
        `).join('');
      })
      .catch(() => { 
        if (savedMentors) savedMentors.innerHTML = '<p class="text-muted">Unable to load suggested mentors.</p>'; 
      });
  }

  renderFeaturedMentors();
  renderCareerResources();
}

function updateDashboardOverview() {
  // Update mentor overview
  const mentorOverview = document.getElementById('mentorOverview');
  if (mentorOverview) {
    fetch('/api/sessions?menteeId=s1&status=upcoming')
      .then(res => res.json())
      .then(data => {
        const sessions = data.sessions || [];
        if (sessions.length > 0) {
          const mentorName = sessions[0].mentorName || 'Your Mentor';
          mentorOverview.innerHTML = `
            <strong>${mentorName}</strong>
            <span>My Mentor · Active</span>
          `;
        } else {
          mentorOverview.innerHTML = `
            <strong>No Mentor</strong>
            <span>Request mentorship</span>
          `;
        }
      })
      .catch(() => {
        mentorOverview.innerHTML = `
          <strong>Grace Akoto</strong>
          <span>My Mentor · Assigned</span>
        `;
      });
  }

  // Update sessions overview
  const sessionsOverview = document.getElementById('sessionsOverview');
  if (sessionsOverview) {
    fetch('/api/sessions?menteeId=s1&status=upcoming')
      .then(res => res.json())
      .then(data => {
        const upcomingSessions = data.sessions || [];
        const count = upcomingSessions.length;
        sessionsOverview.innerHTML = `
          <strong>${count} Upcoming</strong>
          <span>Sessions ${count === 1 ? 'scheduled' : 'this week'}</span>
        `;
      })
      .catch(() => {
        sessionsOverview.innerHTML = `
          <strong>2 Upcoming</strong>
          <span>Sessions this week</span>
        `;
      });
  }

  // Update notifications overview
  const notificationsOverview = document.getElementById('notificationsOverview');
  if (notificationsOverview) {
    fetch('/api/notifications/s1')
      .then(res => res.json())
      .then(data => {
        const notifications = data.notifications || [];
        const unreadCount = notifications.filter(n => !n.is_read && !n.read).length;
        notificationsOverview.innerHTML = `
          <strong>${unreadCount} Unread</strong>
          <span>${unreadCount === 1 ? 'Message' : 'Messages'}</span>
        `;
      })
      .catch(() => {
        notificationsOverview.innerHTML = `
          <strong>2 Unread</strong>
          <span>Messages</span>
        `;
      });
  }
}

function initMentorDashboard() {
  const incoming = document.getElementById('mentorRequests');
  const availability = document.getElementById('mentorAvailability');
  const sessionHistory = document.getElementById('mentorSessionHistory');
  const studentProfiles = document.getElementById('mentorStudents');
  if (incoming) incoming.innerHTML = sampleMentorRequests.map(req => `
    <article class="request-card">
      <strong>${req.mentee}</strong>
      <p>${req.topic}</p>
      <span class="status-pill status-${req.status}">${req.status}</span>
      <small>${req.date}</small>
    </article>
  `).join('');
  if (availability) availability.innerHTML = '<p>Wednesday 16:00 - 18:00<br>Saturday 10:00 - 12:00</p>';
  if (sessionHistory) sessionHistory.innerHTML = sampleSessions.map(sess => `
    <article class="activity-card">
      <strong>${sess.title}</strong>
      <p>${sess.date} · ${sess.time}</p>
      <span class="status-pill status-${sess.status}">${sess.status}</span>
    </article>
  `).join('');
  if (studentProfiles) studentProfiles.innerHTML = sampleMentorRequests.map(req => `
    <article class="profile-card">
      <h4>${req.mentee}</h4>
      <p>Interested in: ${req.topic}</p>
    </article>
  `).join('');
}

function initAdminDashboard() {
  fetch('/api/analytics/dashboard')
    .then(res => res.json())
    .then(data => {
      const metrics = document.getElementById('adminMetrics');
      if (metrics) metrics.innerHTML = `
        <article class="metric-card"><strong>${data.stats.students.toLocaleString()}</strong><span>Active students</span></article>
        <article class="metric-card"><strong>${data.stats.mentors}</strong><span>Verified mentors</span></article>
        <article class="metric-card"><strong>${data.stats.satisfaction}%</strong><span>Satisfaction rate</span></article>
        <article class="metric-card"><strong>${data.stats.sessions.toLocaleString()}</strong><span>Total sessions</span></article>
      `;
      const reports = document.getElementById('adminReports');
      if (reports) reports.innerHTML = `
        <article class="request-card"><strong>Mentorship requests</strong><p>${data.recentRequests.length} recent requests pending review</p></article>
        <article class="request-card"><strong>Top mentors</strong><p>${data.topMentors[0]?.name || 'N/A'} leads with ${data.topMentors[0]?.rating || 0} rating</p></article>
        <article class="request-card"><strong>Platform growth</strong><p>${data.stats.students.toLocaleString()} students registered this semester</p></article>
      `;
    })
    .catch(() => initAdminDashboardFallback());

  const userTable = document.getElementById('adminUsers');
  if (userTable) userTable.innerHTML = `
    <thead><tr><th>User</th><th>Role</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td>Amina Boateng</td><td>Student</td><td><span class="status-pill status-accepted">Active</span></td></tr>
      <tr><td>Abena Darko</td><td>Mentor</td><td><span class="status-pill status-accepted">Active</span></td></tr>
      <tr><td>Samuel Tetteh</td><td>Mentor</td><td><span class="status-pill status-pending">Pending</span></td></tr>
      <tr><td>Kofi Mensah</td><td>Student</td><td><span class="status-pill status-accepted">Active</span></td></tr>
    </tbody>
  `;
}

function initAdminDashboardFallback() {
  const metrics = document.getElementById('adminMetrics');
  const reports = document.getElementById('adminReports');
  if (metrics) metrics.innerHTML = `
    <article class="metric-card"><strong>2,847</strong><span>Active students</span></article>
    <article class="metric-card"><strong>156</strong><span>Verified mentors</span></article>
    <article class="metric-card"><strong>96%</strong><span>Satisfaction rate</span></article>
  `;
  if (reports) reports.innerHTML = `
    <article class="request-card"><strong>New mentor applications</strong><p>12 pending approvals</p></article>
    <article class="request-card"><strong>Platform uptime</strong><p>99.9% over last 30 days</p></article>
  `;
}

function initNotifications() {
  const container = document.getElementById('notificationsList');
  const markAllBtn = document.getElementById('markAllRead');
  const notifications = [
    { type: 'session', title: 'Upcoming session tomorrow', message: 'Your session with Grace Akoto is scheduled for 6:00 PM.', date: '2026-02-04', read: false },
    { type: 'request', title: 'Mentorship request accepted', message: 'Dr. Kwame Asante accepted your mentorship request.', date: '2026-02-01', read: false },
    { type: 'resource', title: 'New interview guide', message: 'Ace Your Technical Interview is now in the Resource Centre.', date: '2026-01-25', read: true },
    { type: 'announcement', title: 'Career fair announcement', message: 'UG Career Fair 2026 registration opens next week.', date: '2026-01-20', read: true }
  ];

  function render() {
    if (!container) return;
    container.innerHTML = notifications.map((n, i) => `
      <article class="notification-card ${n.read ? 'read' : 'unread'}" data-index="${i}">
        <div class="notification-meta">
          <span class="badge badge-${n.type === 'session' ? 'accent' : n.type === 'request' ? 'success' : 'primary'}">${n.type}</span>
          <small>${n.date}</small>
        </div>
        <strong>${n.title}</strong>
        <p>${n.message}</p>
      </article>
    `).join('');
  }

  render();
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      notifications.forEach(n => { n.read = true; });
      render();
    });
  }
}

function initSettings() {
  // Theme picker
  const saved = localStorage.getItem('mentorbridgeTheme') || 'light';
  const radios = document.querySelectorAll('input[name="theme"]');
  radios.forEach(r => {
    if (r.value === saved) r.checked = true;
    r.addEventListener('change', () => {
      const theme = r.value === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : r.value;
      ThemeManager.set(theme);
      const feedback = document.getElementById('theme-save-feedback');
      if (feedback) {
        feedback.textContent = 'Theme updated.';
        feedback.className = 'form-feedback form-feedback--success';
        setTimeout(() => { feedback.textContent = ''; }, 2000);
      }
    });
  });

  // Password form
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', e => {
      e.preventDefault();
      const current = document.getElementById('currentPassword')?.value;
      const newPw = document.getElementById('newPassword')?.value;
      const confirm = document.getElementById('confirmPassword')?.value;
      const feedback = document.getElementById('password-feedback');
      if (!current || !newPw || !confirm) {
        feedback.textContent = 'Please fill in all password fields.';
        feedback.className = 'form-feedback form-feedback--error';
        return;
      }
      if (newPw !== confirm) {
        feedback.textContent = 'New passwords do not match.';
        feedback.className = 'form-feedback form-feedback--error';
        return;
      }
      if (newPw.length < 8) {
        feedback.textContent = 'Password must be at least 8 characters.';
        feedback.className = 'form-feedback form-feedback--error';
        return;
      }
      feedback.textContent = 'Password updated successfully.';
      feedback.className = 'form-feedback form-feedback--success';
      passwordForm.reset();
    });
  }

  // Privacy save
  const savePrivacyBtn = document.getElementById('savePrivacyBtn');
  if (savePrivacyBtn) {
    savePrivacyBtn.addEventListener('click', () => {
      const feedback = document.getElementById('privacy-feedback');
      if (feedback) {
        feedback.textContent = 'Privacy preferences saved.';
        feedback.className = 'form-feedback form-feedback--success';
        setTimeout(() => { feedback.textContent = ''; }, 2000);
      }
    });
  }

  // Settings nav active state on scroll
  const sections = document.querySelectorAll('.setting-card[id]');
  const navLinks = document.querySelectorAll('.settings-nav-link');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const link = document.querySelector(`.settings-nav-link[href="#${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0.5 });
  sections.forEach(s => observer.observe(s));
}

function initStudentProfile() {
  const saveBtn = document.querySelector('.profile-card .btn-primary, .setting-form .btn-primary');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const alert = document.createElement('div');
      alert.className = 'alert alert-success';
      alert.textContent = 'Profile updated successfully.';
      alert.style.marginTop = '1rem';
      document.querySelector('.setting-form, .profile-card form')?.appendChild(alert);
      setTimeout(() => alert.remove(), 3000);
    });
  }
}

function setupFaqs() {
  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      item?.classList.toggle('open');
    });
  });
}

function hidePageLoader() {
  const loader = document.getElementById('pageLoader');
  if (loader) loader.classList.add('hidden');
}

/* ─── Public namespace (for tests and external consumers) ──────────── */
window.MentorBridge = window.MentorBridge || {};
window.MentorBridge.renderMentorCard   = renderMentorCard;
window.MentorBridge.renderResourceCard = renderResourceCard;

document.addEventListener('DOMContentLoaded', () => {
  loadFirebaseConfig()
    .then(() => initFirebase())
    .catch(() => {})
    .finally(() => {
      initPage();
      hidePageLoader();
    });
});
