/**
 * Form Validation Module
 * Provides email, password, and general form validation
 */
const FormValidator = {
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  validateEmail(email) {
    const trimmed = email.trim();
    if (!trimmed) return { valid: false, error: 'Email is required' };
    if (!this.emailPattern.test(trimmed)) return { valid: false, error: 'Please enter a valid email address' };
    if (trimmed.length > 254) return { valid: false, error: 'Email is too long' };
    return { valid: true };
  },

  validatePassword(password) {
    if (!password) return { valid: false, error: 'Password is required' };
    if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
    const strengthScore = this.getPasswordStrength(password);
    return { 
      valid: true, 
      strength: strengthScore,
      feedback: this.getPasswordFeedback(strengthScore)
    };
  },

  getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  },

  getPasswordFeedback(strength) {
    const feedback = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return feedback[strength] || 'Very weak';
  },

  validateRequired(value, fieldName) {
    if (!value || !value.trim()) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  },

  clearFieldError(inputElement) {
    const container = inputElement.closest('.form-group');
    if (!container) return;
    const errorEl = container.querySelector('.form-error');
    if (errorEl) errorEl.remove();
    inputElement.classList.remove('form-input-error');
  },

  showFieldError(inputElement, errorMessage) {
    const container = inputElement.closest('.form-group');
    if (!container) return;
    this.clearFieldError(inputElement);
    inputElement.classList.add('form-input-error');
    const errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    errorEl.textContent = errorMessage;
    errorEl.style.cssText = 'display: block; color: var(--color-error); font-size: var(--font-size-xs); margin-top: 0.25rem;';
    container.appendChild(errorEl);
  }
};

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

const sampleMentors = [
  {
    id: 'm1',
    name: 'Dr. Kwame Asante',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80',
    position: 'Senior Software Engineer',
    company: 'Google Ghana',
    yearsExperience: 12,
    rating: 4.9,
    skills: ['JavaScript', 'Cloud Architecture', 'System Design'],
    careerField: 'Software Engineering',
    programme: 'Computer Science'
  },
  {
    id: 'm2',
    name: 'Abena Darko',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80',
    position: 'VP, Corporate Banking',
    company: 'Ecobank Ghana',
    yearsExperience: 15,
    rating: 4.8,
    skills: ['Financial Analysis', 'Investment', 'Leadership'],
    careerField: 'Banking & Finance',
    programme: 'Business Administration'
  },
  {
    id: 'm3',
    name: 'Prof. Efua Mensah',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80',
    position: 'Associate Professor',
    company: 'University of Ghana Medical School',
    yearsExperience: 18,
    rating: 4.9,
    skills: ['Research', 'Academic Writing', 'Clinical Mentorship'],
    careerField: 'Medicine',
    programme: 'Medicine & Surgery'
  }
];

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
  { title: 'Professional Resume Template for UG Students', category: 'Resume', description: 'Tailored resume layout for applications to internships and graduate roles.', link: './pages/resource-centre.html' },
  { title: 'Ace Your Technical Interview', category: 'Interview', description: 'Prepare for coding challenges and behavioural interviews with confidence.', link: './pages/resource-centre.html' },
  { title: 'Career Roadmap: From Campus to Corporate', category: 'Career Roadmap', description: 'Plan each year of university with milestones for growth and networking.', link: './pages/resource-centre.html' }
];

const sampleAiRecommendations = [
  {
    photo: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80',
    name: 'Abena Darko',
    position: 'VP, Corporate Banking',
    company: 'Ecobank Ghana',
    matchReasons: ['Finance', 'Career planning', 'Business networks'],
    matchScore: 94
  },
  {
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80',
    name: 'Dr. Kwame Asante',
    position: 'Senior Software Engineer',
    company: 'Google Ghana',
    matchReasons: ['Tech careers', 'Interview prep', 'Software architecture'],
    matchScore: 91
  }
];

function initPage() {
  const page = document.body.dataset.page;
  ThemeManager.init();
  setupNavigation();
  setupBackToTop();
  setupFaqs();
  GlobalSearch.init();
  showDemoBanner();
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

function showDemoBanner() {
  if (!isDemoMode || !isDemoMode()) return;
  const existing = document.getElementById('demoBanner');
  if (existing) return;
  const banner = document.createElement('div');
  banner.id = 'demoBanner';
  banner.className = 'demo-banner';
  banner.innerHTML = '<p>Demo mode — Firebase not configured. Login works locally for presentation. <a href="./pages/login.html">Try it</a></p>';
  document.body.prepend(banner);
}

function setupNavigation() {
  const menuToggle = document.getElementById('menuToggle');
  const menu = document.getElementById('navLinks');
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', open);
      if (open) {
        menu.querySelector('a')?.focus();
      }
    });
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => menu.classList.remove('open'));
    });
    // Close menu on Escape key
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        menu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', false);
        menuToggle.focus();
      }
    });
  }

  // Keyboard shortcut for search: Cmd+K or Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchTrigger = document.getElementById('globalSearchTrigger');
      if (searchTrigger) searchTrigger.click();
      const searchInput = document.getElementById('globalSearchInput');
      if (searchInput) setTimeout(() => searchInput.focus(), 100);
    }
    if (e.key === 'Escape') {
      const overlay = document.getElementById('searchOverlay');
      if (overlay && overlay.getAttribute('aria-hidden') === 'false') {
        const closeBtn = document.getElementById('searchClose');
        if (closeBtn) closeBtn.click();
      }
    }
  });
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
  renderFeaturedMentors();
  renderAiRecommendations();
  renderCareerResources();
}

function renderFeaturedMentors() {
  const containers = document.querySelectorAll('.featured-mentor-placeholder');
  if (!containers.length) return;
  fetch('/api/mentors?featured=true')
    .then(res => res.json())
    .then(data => {
      const mentors = (data?.recommendations?.length ? data.recommendations : sampleAiRecommendations);
      const html = mentors.map(renderMentorCard).join('');
      containers.forEach(container => {
        container.innerHTML = html;
      });
    })
    .catch(() => {
      const html = sampleMentors.map(renderMentorCard).join('');
      containers.forEach(container => {
        container.innerHTML = html;
      });
    });
}

function renderMentorCard(mentor) {
  return `
    <article class="mentor-card">
      <div class="mentor-card-top">
        <img class="mentor-avatar" src="${mentor.photo}" alt="${mentor.name}" />
        <div class="mentor-info">
          <h4>${mentor.name}</h4>
          <p>${mentor.position} at ${mentor.company}</p>
          <div class="mentor-badges">
            <span class="badge badge-secondary">${mentor.yearsExperience}+ yrs</span>
            <span class="badge badge-accent">${mentor.rating} ★</span>
          </div>
        </div>
      </div>
      <p>${mentor.biography}</p>
      <div class="tag-list">
        ${mentor.skills.slice(0, 3).map(skill => `<span class="tag-pill">${skill}</span>`).join('')}
      </div>
      <div class="section-actions" style="margin-top: var(--spacing-md);">
        <a class="btn btn-outline" href="/pages/mentor-profile.html?id=${mentor.id}">View profile</a>
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
      const mentors = (data?.recommendations?.length ? data.recommendations : sampleAiRecommendations);
      const html = mentors.map(mentor => `
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
      const html = sampleAiRecommendations.map(mentor => `
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
    });
}

function renderCareerResources(containerId = 'resourceHighlights') {
  const container = document.getElementById(containerId);
  if (!container) return;

  fetch('/api/resources')
    .then(res => res.json())
    .then(data => {
      container.innerHTML = (data.resources || sampleResources).map(resource => `
        <article class="resource-card">
          <span class="badge badge-accent">${resource.category}</span>
          <h3>${resource.title}</h3>
          <p>${resource.description}</p>
          <a class="btn btn-ghost" href="/pages/resource-centre.html">Explore resource</a>
        </article>
      `).join('');
    })
    .catch(() => {
      container.innerHTML = sampleResources.map(resource => `
        <article class="resource-card">
          <span class="badge badge-accent">${resource.category}</span>
          <h3>${resource.title}</h3>
          <p>${resource.description}</p>
          <a class="btn btn-ghost" href="${resource.link}">Explore resource</a>
        </article>
      `).join('');
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
  container.innerHTML = `
    <article class="mentor-card">
      <div class="mentor-card-top">
        <img class="mentor-avatar" src="${mentor.photo}" alt="${mentor.name}" />
        <div class="mentor-info">
          <h2>${mentor.name}</h2>
          <p>${mentor.position} at ${mentor.company}</p>
          <div class="mentor-meta">
            <span class="badge badge-secondary">${mentor.careerField}</span>
            <span class="badge badge-accent">${mentor.yearsExperience} yrs experience</span>
            <span class="badge badge-success">${mentor.rating} ★ (${mentor.reviewCount})</span>
          </div>
        </div>
      </div>
      <p>${mentor.biography}</p>
      <div class="mentor-meta" style="gap: 0.5rem; margin-top: var(--spacing-md);">
        <span class="badge badge-primary">Programme: ${mentor.programme}</span>
        <span class="badge badge-primary">Availability: ${mentor.availability}</span>
      </div>
      <div class="profile-details" style="margin: var(--spacing-lg) 0; display: grid; gap: var(--spacing-md);">
        <p><strong>Education:</strong> ${mentor.education}</p>
        <p><strong>Industries:</strong> ${mentor.industries.join(', ')}</p>
        <p><strong>Languages:</strong> ${mentor.languages.join(', ')}</p>
      </div>
      <div class="tag-list" style="margin: var(--spacing-lg) 0;">
        ${mentor.skills.map(skill => `<span class="tag-pill">${skill}</span>`).join('')}
      </div>
      <div class="section-actions">
        <a class="btn btn-primary" href="./mentor-directory.html">Request Mentorship</a>
      </div>
    </article>
    <section class="section" style="margin-top: var(--spacing-xl);">
      <h3>Student reviews</h3>
      <div class="testimonial-grid" style="grid-template-columns: 1fr;">
        ${mentor.reviews.length ? mentor.reviews.map(review => `
          <article class="testimonial-card">
            <div class="testimonial-content">
              <p>“${review.text}”</p>
            </div>
            <div class="testimonial-author">
              <div>
                <strong>${review.student}</strong>
                <span>${review.date}</span>
              </div>
            </div>
          </article>
        `).join('') : '<p>No reviews yet.</p>'}
      </div>
    </section>
  `;
}

function initResourceCentre() {
  const container = document.getElementById('resourceCentreList');
  if (!container) return;
  fetch('/api/resources')
    .then(res => res.json())
    .then(data => {
      container.innerHTML = (data.resources || []).map(resource => `
        <article class="resource-card card">
          <div class="card-body">
            <span class="badge badge-accent">${resource.category}</span>
            <h3>${resource.title}</h3>
            <p>${resource.description}</p>
            <div class="flex-between mt-md">
              <span class="text-sm text-muted">${resource.readTime} read</span>
              <button class="btn btn-primary btn-sm" type="button">Open resource</button>
            </div>
          </div>
        </article>
      `).join('');
    })
    .catch(() => {
      container.innerHTML = sampleResources.map(r => `
        <article class="resource-card card"><div class="card-body"><h3>${r.title}</h3><p>${r.description}</p></div></article>
      `).join('');
    });
}

function initLogin() {
  const tabs = document.querySelectorAll('[data-auth-tab]');
  const panels = document.querySelectorAll('[data-auth-panel]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(item => item.classList.remove('active'));
      panels.forEach(panel => panel.classList.add('hidden'));
      const target = tab.dataset.authTab;
      tab.classList.add('active');
      document.querySelector(`[data-auth-panel="${target}"]`)?.classList.remove('hidden');
    });
  });
  document.querySelectorAll('.show-password').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const input = document.getElementById(toggle.dataset.target);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      toggle.textContent = input.type === 'password' ? 'Show password' : 'Hide password';
    });
  });

  const loginButtons = [
    { id: 'loginStudentButton', prefix: 'student', redirect: './student-dashboard.html' },
    { id: 'loginMentorButton', prefix: 'mentor', redirect: './mentor-dashboard.html' },
    { id: 'loginAdminButton', prefix: 'admin', redirect: './admin-dashboard.html' }
  ];
  const loginMessage = document.getElementById('loginMessage');

  const handleLogin = async (btn, prefix, redirect) => {
    const emailInput = document.getElementById(`${prefix}Email`);
    const passwordInput = document.getElementById(`${prefix}Password`);
    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    // Clear previous errors
    if (emailInput) FormValidator.clearFieldError(emailInput);
    if (passwordInput) FormValidator.clearFieldError(passwordInput);

    // Validate email
    const emailValidation = FormValidator.validateEmail(email);
    if (!emailValidation.valid) {
      if (emailInput) FormValidator.showFieldError(emailInput, emailValidation.error);
      if (loginMessage) loginMessage.textContent = emailValidation.error;
      return;
    }

    // Validate password
    const passwordValidation = FormValidator.validatePassword(password);
    if (!passwordValidation.valid) {
      if (passwordInput) FormValidator.showFieldError(passwordInput, passwordValidation.error);
      if (loginMessage) loginMessage.textContent = passwordValidation.error;
      return;
    }

    // Show loading state
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
      await signInUser(email, password, prefix);
      if (loginMessage) loginMessage.textContent = 'Login successful. Redirecting...';
      loginMessage.style.color = 'var(--color-success)';
      setTimeout(() => { window.location.href = redirect; }, 800);
    } catch (error) {
      btn.disabled = false;
      btn.textContent = 'Login as ' + prefix;
      const errorMsg = error.message || 'Login failed. Please try again.';
      if (loginMessage) {
        loginMessage.textContent = errorMsg;
        loginMessage.style.color = 'var(--color-error)';
      }
    }
  };

  loginButtons.forEach(({ id, prefix, redirect }) => {
    const btn = document.getElementById(id);
    const emailInput = document.getElementById(`${prefix}Email`);
    const passwordInput = document.getElementById(`${prefix}Password`);

    // Click handler
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogin(btn, prefix, redirect);
      });
    }

    // Enter key on password field submits form
    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleLogin(btn, prefix, redirect);
        }
      });
    }
  });
}

function initRegister() {
  const roleButtons = document.querySelectorAll('[data-register-role]');
  const roleForms = document.querySelectorAll('[data-register-panel]');
  roleButtons.forEach(button => {
    button.addEventListener('click', () => {
      roleButtons.forEach(item => item.classList.remove('active'));
      roleForms.forEach(panel => panel.classList.add('hidden'));
      button.classList.add('active');
      document.querySelector(`[data-register-panel="${button.dataset.registerRole}"]`)?.classList.remove('hidden');
    });
  });

  const registerStudentButton = document.getElementById('registerStudentButton');
  const registerMentorButton = document.getElementById('registerMentorButton');
  const registerMessage = document.getElementById('registerMessage');

  if (registerStudentButton) {
    registerStudentButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('studentEmail');
      const passwordInput = document.getElementById('studentPassword');
      const nameInput = document.getElementById('studentName');
      const programmeInput = document.getElementById('studentProgramme');

      const email = emailInput?.value.trim();
      const password = passwordInput?.value;
      const name = nameInput?.value.trim();
      const programme = programmeInput?.value.trim();
      const level = document.getElementById('studentLevel')?.value;

      // Clear previous errors
      [emailInput, passwordInput, nameInput, programmeInput].forEach(input => {
        if (input) FormValidator.clearFieldError(input);
      });

      // Validate all fields
      const nameValidation = FormValidator.validateRequired(name, 'Full name');
      if (!nameValidation.valid) {
        if (nameInput) FormValidator.showFieldError(nameInput, nameValidation.error);
        if (registerMessage) registerMessage.textContent = nameValidation.error;
        return;
      }

      const emailValidation = FormValidator.validateEmail(email);
      if (!emailValidation.valid) {
        if (emailInput) FormValidator.showFieldError(emailInput, emailValidation.error);
        if (registerMessage) registerMessage.textContent = emailValidation.error;
        return;
      }

      const passwordValidation = FormValidator.validatePassword(password);
      if (!passwordValidation.valid) {
        if (passwordInput) FormValidator.showFieldError(passwordInput, passwordValidation.error);
        if (registerMessage) registerMessage.textContent = passwordValidation.error;
        return;
      }

      const programmeValidation = FormValidator.validateRequired(programme, 'Programme');
      if (!programmeValidation.valid) {
        if (programmeInput) FormValidator.showFieldError(programmeInput, programmeValidation.error);
        if (registerMessage) registerMessage.textContent = programmeValidation.error;
        return;
      }

      // Show loading state
      registerStudentButton.disabled = true;
      registerStudentButton.textContent = 'Creating account...';

      try {
        const result = await registerUser(email, password, 'student');
        await createUserProfile(result.user, {
          name,
          role: 'student',
          programme,
          level,
          createdAt: new Date().toISOString()
        });
        if (registerMessage) {
          registerMessage.textContent = 'Account created successfully. Redirecting to login...';
          registerMessage.style.color = 'var(--color-success)';
        }
        setTimeout(() => window.location.href = './login.html', 1200);
      } catch (error) {
        registerStudentButton.disabled = false;
        registerStudentButton.textContent = 'Create student account';
        const errorMsg = error.message || 'Registration failed. Please try again.';
        if (registerMessage) {
          registerMessage.textContent = errorMsg;
          registerMessage.style.color = 'var(--color-error)';
        }
      }
    });
  }

  if (registerMentorButton) {
    registerMentorButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('mentorEmail');
      const passwordInput = document.getElementById('mentorPassword');
      const nameInput = document.getElementById('mentorName');
      const companyInput = document.getElementById('mentorCompany');

      const email = emailInput?.value.trim();
      const password = passwordInput?.value;
      const name = nameInput?.value.trim();
      const company = companyInput?.value.trim();
      const specialty = document.getElementById('mentorSpecialty')?.value.trim();

      // Clear previous errors
      [emailInput, passwordInput, nameInput, companyInput].forEach(input => {
        if (input) FormValidator.clearFieldError(input);
      });

      // Validate all fields
      const nameValidation = FormValidator.validateRequired(name, 'Full name');
      if (!nameValidation.valid) {
        if (nameInput) FormValidator.showFieldError(nameInput, nameValidation.error);
        if (registerMessage) registerMessage.textContent = nameValidation.error;
        return;
      }

      const emailValidation = FormValidator.validateEmail(email);
      if (!emailValidation.valid) {
        if (emailInput) FormValidator.showFieldError(emailInput, emailValidation.error);
        if (registerMessage) registerMessage.textContent = emailValidation.error;
        return;
      }

      const passwordValidation = FormValidator.validatePassword(password);
      if (!passwordValidation.valid) {
        if (passwordInput) FormValidator.showFieldError(passwordInput, passwordValidation.error);
        if (registerMessage) registerMessage.textContent = passwordValidation.error;
        return;
      }

      const companyValidation = FormValidator.validateRequired(company, 'Company');
      if (!companyValidation.valid) {
        if (companyInput) FormValidator.showFieldError(companyInput, companyValidation.error);
        if (registerMessage) registerMessage.textContent = companyValidation.error;
        return;
      }

      // Show loading state
      registerMentorButton.disabled = true;
      registerMentorButton.textContent = 'Creating account...';

      try {
        const result = await registerUser(email, password, 'mentor');
        await createUserProfile(result.user, {
          name,
          role: 'mentor',
          company,
          specialty,
          createdAt: new Date().toISOString()
        });
        if (registerMessage) {
          registerMessage.textContent = 'Mentor account created. Redirecting to login...';
          registerMessage.style.color = 'var(--color-success)';
        }
        setTimeout(() => window.location.href = './login.html', 1200);
      } catch (error) {
        registerMentorButton.disabled = false;
        registerMentorButton.textContent = 'Create mentor account';
        const errorMsg = error.message || 'Registration failed. Please try again.';
        if (registerMessage) {
          registerMessage.textContent = errorMsg;
          registerMessage.style.color = 'var(--color-error)';
        }
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

  if (sessionsList) sessionsList.innerHTML = sampleSessions.map(sess => `
    <tr>
      <td>${sess.title}</td>
      <td>${sess.date}</td>
      <td><span class="status-pill status-${sess.status}">${sess.status}</span></td>
    </tr>
  `).join('');

  if (notificationsList) notificationsList.innerHTML = sampleNotifications.slice(0, 2).map(note => `
    <article class="notification-card">
      <strong>${note.title}</strong>
      <p>${note.message}</p>
      <small>${note.date}</small>
    </article>
  `).join('');

  if (checklist) {
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
  }

  if (recentActivity) {
    recentActivity.innerHTML = `
      <article class="activity-card"><strong>Mentorship request accepted</strong><p>Dr. Kwame Asante accepted your request · 2 days ago</p></article>
      <article class="activity-card"><strong>Session completed</strong><p>Career path planning with Dr. Kwame Asante · 1 week ago</p></article>
      <article class="activity-card"><strong>Profile updated</strong><p>You added new skills to your profile · 2 weeks ago</p></article>
    `;
  }

  if (savedMentors) {
    fetch('/api/mentors?featured=true')
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
      .catch(() => { savedMentors.innerHTML = '<p class="text-muted">Unable to load saved mentors.</p>'; });
  }

  renderFeaturedMentors();
  renderCareerResources();
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
  const saveBtn = document.querySelector('.setting-form .btn-primary');
  const themeSelect = document.getElementById('themeSetting');
  if (!themeSelect) {
    const themeField = document.getElementById('theme');
    if (themeField) {
      themeField.id = 'themeSetting';
      themeField.innerHTML = '<option value="light">Light mode</option><option value="dark">Dark mode</option>';
      ThemeManager.init();
    }
  } else {
    ThemeManager.init();
  }
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const alert = document.createElement('div');
      alert.className = 'alert alert-success';
      alert.textContent = 'Settings saved successfully.';
      alert.style.marginTop = '1rem';
      document.querySelector('.setting-form')?.appendChild(alert);
      setTimeout(() => alert.remove(), 3000);
    });
  }
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

document.addEventListener('DOMContentLoaded', () => {
  loadFirebaseConfig()
    .then(() => initFirebase())
    .catch(() => {})
    .finally(() => {
      initPage();
      hidePageLoader();
    });
});