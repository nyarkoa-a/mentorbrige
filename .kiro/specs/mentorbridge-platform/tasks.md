# Implementation Plan: MentorBridge Platform

## Overview

Most files already exist. Tasks focus on auditing and completing each HTML page, verifying backend routes, wiring app.js init functions to HTML, hardening the AI matching logic, ensuring responsive design, and setting up the test suite. Work proceeds page-by-page in the required build sequence, ending with a CSS consistency pass and full test coverage.

## Tasks

- [x] 1. Landing Page — complete all sections in index.html
  - [x] 1.1 Audit and complete index.html structure
    - Verify `<body data-page="home">` is set
    - Add sticky navbar with logo, nav links, Login and Register CTAs
    - Ensure all section placeholder containers exist: `#hero`, `#stats`, `#how-it-works`, `#why-mentorbridge`, `#featured-mentors`, `#ai-demo`, `#resources-preview`, `#testimonials`, `#faq`, `#contact`, `#newsletter`, `#footer`
    - _Requirements: 1.1–1.13_

  - [x] 1.2 Implement initHome() rendering in app.js
    - Fetch `GET /api/mentors?featured=true` and render up to 6 mentor cards into `#featured-mentors`
    - Fetch `POST /api/matching/demo` and render top 3 matched mentor cards with scores into `#ai-demo`
    - Fetch `GET /api/resources` and render 3 resource preview cards into `#resources-preview`
    - Populate stats section from `GET /api/mentors` totals or hardcoded mock values
    - Render testimonials array into `#testimonials` with prev/next navigation buttons
    - Render FAQ items into `#faq` with accordion expand/collapse toggle
    - Bind contact form submit (no backend required, show success message)
    - Bind newsletter form submit (show success message)
    - _Requirements: 1.3, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12_

  - [ ]* 1.3 Write property test for renderMentorCard()
    - **Property P1: renderMentorCard(mentor) HTML contains name, position, company, and profile link**
    - **Validates: Requirements 1.6, 4.4**

- [x] 2. Login Page — complete login.html and initLogin()
  - [x] 2.1 Audit and complete login.html
    - Verify `<body data-page="login">` is set
    - Add email input, password input with show/hide toggle, Remember Me checkbox, Forgot Password link, submit button, and `#login-error` feedback element
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Complete initLogin() in app.js
    - On submit: validate fields client-side (non-empty); show error in `#login-error` if blank
    - Attempt FirebaseAuth mock login; on success read role from mock user and redirect to `/pages/student-dashboard.html` or `/pages/mentor-dashboard.html`
    - Handle auth errors by displaying `error.message` in `#login-error`
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 2.8_

  - [ ]* 2.3 Write property tests for login validation
    - **Property P4: Login with empty required fields — no redirect, non-empty error message**
    - **Property P5: Successful login redirects to role-appropriate dashboard URL**
    - **Validates: Requirements 2.1, 2.3**

- [ ] 3. Register Page — complete register.html and initRegister()
  - [-] 3.1 Audit and complete register.html
    - Verify `<body data-page="register">` is set
    - Add Student/Mentor role toggle that shows/hides the correct field sets
    - Student fields: full name, email, password, programme, academic level, skills, interests, career goal
    - Mentor fields: full name, email, password, expertise, industry, bio
    - Add `#register-error` feedback element and submit button
    - _Requirements: 2.4, 2.5, 2.6_

  - [x] 3.2 Complete initRegister() in app.js
    - On submit: validate all required fields for the active role before any async call
    - Show error in `#register-error` on validation failure; do not submit
    - On success: redirect to appropriate dashboard based on selected role
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]3.3 Write property test for register validation
    - **Property P4: Register with empty required fields — no redirect, non-empty error message**
    - **Validates: Requirements 2.7**

- [ ] 4. AI Matching — verify and harden matching.js and backend route
  - [ ] 4.1 Verify and complete calculateScore() in matching.js
    - Implement weights exactly: programme 25, careerField 20, skills 20 (proportional), interests/industries 15 (proportional), careerGoals/skills overlap 15 (proportional), level 5
    - Add rating quality bonus (rating × 2); clamp total to [0, 100]
    - _Requirements: 3.1–3.8_

  - [ ]* 4.2 Write property tests for calculateScore()
    - **Property P6: calculateScore(student, mentor) returns number in [0, 100]**
    - **Property P7: programme match → score ≥ score when no match, all else equal**
    - **Property P8: A.skills ⊃ B.skills → calculateScore(A, mentor) ≥ calculateScore(B, mentor)**
    - **Validates: Requirements 3.1–3.8**

  - [ ] 4.3 Verify and complete getMatchReasons() in matching.js
    - Return at most 3 human-readable reason strings based on matched fields
    - _Requirements: 3.9_

  - [ ]* 4.4 Write property test for getMatchReasons()
    - **Property P9: getMatchReasons returns array of length ≤ 3**
    - **Validates: Requirements 3.9**

  - [ ] 4.5 Verify backend/routes/matching.js mirrors client-side algorithm
    - Ensure `POST /api/matching/recommend` uses identical weights and clamp as matching.js
    - Ensure response returns up to 6 mentors sorted descending by matchScore
    - Ensure `POST /api/matching/demo` returns top 3 with a default sample student if no body
    - _Requirements: 3.10, 3.11_

  - [ ]* 4.6 Write property test for /api/matching/recommend endpoint
    - **Property P10: POST /api/matching/recommend returns ≤ 6 results sorted descending by matchScore**
    - **Validates: Requirements 3.10**

- [ ] 5. Student Dashboard — complete student-dashboard.html and initStudentDashboard()
  - [ ] 5.1 Audit and complete student-dashboard.html
    - Verify `<body data-page="student-dashboard">` is set
    - Add containers: `#match-recommendations`, `#active-requests`, `#unread-count` badge, user greeting
    - _Requirements: 3.10, 8.3_

  - [ ] 5.2 Complete initStudentDashboard() in app.js
    - Fetch `POST /api/matching/recommend` with mock student profile and render up to 6 recommendation cards showing matchScore and matchReasons
    - Fetch `GET /api/users/requests` and render active requests list
    - Fetch `GET /api/notifications/:userId` and update unread badge count
    - _Requirements: 3.10, 8.3_

  - [ ]* 5.3 Write property test for recommendation card rendering
    - **Property P2: Recommendation card HTML contains matchScore value**
    - **Validates: Requirements 3.10**

- [ ] 6. Mentor Directory — complete mentor-directory.html and initDirectory()
  - [ ] 6.1 Audit and complete mentor-directory.html
    - Verify `<body data-page="mentor-directory">` is set
    - Add `#search-input`, filter dropdowns (industry, skills, careerField, availability, minExperience, minRating), `#mentor-grid` container
    - _Requirements: 4.1–4.4_

  - [ ] 6.2 Complete initDirectory() in app.js
    - Fetch `GET /api/mentors/filters` and populate filter dropdown options
    - Fetch `GET /api/mentors` with current search/filter params and render mentor cards into `#mentor-grid`
    - Bind search input and all filter controls to re-fetch on change (debounce search by 300ms)
    - Each card shows photo, name, position, company, top 3 skills, rating, "View Profile" link to `mentor-profile.html?id=`
    - _Requirements: 4.1–4.5_

  - [ ] 6.3 Verify backend/routes/mentors.js filtering logic
    - Ensure all filter params (search, industry, skill, careerField, availability, minExperience, minRating, featured) applied with AND logic
    - Case-insensitive search across name, company, skills, industries
    - _Requirements: 4.2, 4.3_

  - [ ]* 6.4 Write property tests for mentor filtering
    - **Property P11: GET /api/mentors with filters returns only mentors satisfying all predicates**
    - **Property P12: GET /api/mentors?search=x returns only mentors containing x in name/company/skills/industries**
    - **Validates: Requirements 4.2, 4.3**

- [ ] 7. Mentor Profile — complete mentor-profile.html and initMentorProfile()
  - [ ] 7.1 Audit and complete mentor-profile.html
    - Verify `<body data-page="mentor-profile">` is set
    - Add containers: `#mentor-photo`, `#mentor-name`, `#mentor-position`, `#mentor-company`, `#mentor-bio`, `#mentor-education`, `#mentor-experience`, `#mentor-skills`, `#mentor-industries`, `#mentor-languages`, `#mentor-availability`, `#mentor-rating`, `#mentor-reviews`, `#request-btn`, `#profile-error`
    - _Requirements: 5.1–5.4_

  - [ ] 7.2 Complete initMentorProfile() in app.js
    - Read `?id=` from URL; if missing or empty show error in `#profile-error` and return
    - Fetch `GET /api/mentors/:id`; on 404 show error in `#profile-error` and return
    - Populate all profile containers with mentor data including reviews list
    - Bind "Request Mentorship" button to `POST /api/users/requests` with mock student data; show confirmation on success
    - _Requirements: 5.1–5.4_

  - [ ]* 7.3 Write property test for renderMentorProfilePage()
    - **Property P13: renderMentorProfilePage(mentor) HTML contains name, position, company, biography, skills, reviews heading**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 8. Student Profile — complete student-profile.html and initStudentProfile()
  - [ ] 8.1 Audit and complete student-profile.html
    - Verify `<body data-page="student-profile">` is set
    - Add form fields: profile picture, programme, academic level, skills, interests, career goals, LinkedIn URL; add `#save-success` and `#save-error` feedback elements
    - _Requirements: 6.1_

  - [ ] 8.2 Complete initStudentProfile() in app.js
    - Load current mock student record into form fields on init
    - On save: validate required fields; update in-memory student record; show success message in `#save-success`
    - _Requirements: 6.1, 6.2_

  - [ ]* 8.3 Write property test for profile save
    - **Property P14: Valid profile save — in-memory record updated, success message shown**
    - **Validates: Requirements 6.2**

- [ ] 9. Resource Centre — complete resource-centre.html and initResourceCentre()
  - [ ] 9.1 Audit and complete resource-centre.html
    - Verify `<body data-page="resource-centre">` is set
    - Add `#resource-grid` container
    - _Requirements: 7.1, 7.2_

  - [ ] 9.2 Complete initResourceCentre() in app.js
    - Fetch `GET /api/resources` and render cards showing title, category, description, readTime, and download/view button
    - Fall back to local sample array on fetch failure
    - _Requirements: 7.1, 7.2_

  - [ ]* 9.3 Write property test for resource card rendering
    - **Property P3: Resource card HTML contains title, category, description, readTime**
    - **Validates: Requirements 7.1, 7.2**

- [ ] 10. Notifications — complete notifications.html and initNotifications()
  - [ ] 10.1 Audit and complete notifications.html
    - Verify `<body data-page="notifications">` is set
    - Add `#notifications-list`, `#mark-all-read` button, `#unread-badge` in navbar
    - _Requirements: 8.1–8.3_

  - [ ] 10.2 Complete initNotifications() in app.js
    - Fetch `GET /api/notifications/:userId` and render items with class `unread` or `read` per `notification.read` flag
    - Bind "MarkrDashboard()
  - [ ] 11.1 Audit and complete mentor-dashboard.html
    - Verify `<body data-page="mentor-dashboard">` is set
    - Add `#pending-requests` list and profile edit section
    - _Requirements: 9.1, 9.2_

  - [ ] 11.2 Complete initMentorDashboard() in app.js
    - Fetch `GET /api/users/requests` filtered to pending status and render with Accept and Decline buttons
    - Bind Accept/Decline to update request status in-memory and re-render
    - Add profile edit form to update mentor bio/skills in-memory
    - _Requirements: 9.1, 9.2_

- [ ] 12. Settings — complete settings.html and initSettings()
  - [ ] 12.1 Audit and complete settings.html
    - Verify `<body data-page="settings">` is set
    - Add dark/light mode toggle and password change form (current, new, confirm fields)
    - _Requirements: 10.1–10.4_

  - [ ] 12.2 Complete initSettings() in app.js
    - Bind theme toggle to ThemeManager; persist to `localStorage` key `theme`; apply stored theme on load with no flash
    - Bind password change form: validate new === confirm, show success/error message
    - _Requirements: 10.1–10.4_

  - [ ]* 12.3 Write property test for ThemeManager
    - **Property P17: dataset.theme and localStorage both equal applied value; toggle twice returns to original**
    - **Validates: Requirements 10.1–10.3**

- [ ] 13. Admin Dashboard — complete admin-dashboard.html and initAdminDashboard()
  - [ ] 13.1 Audit and complete admin-dashboard.html
    - Verify `<body data-page="admin-dashboard">` is set
    - Add `#students-table` and `#mentors-table` containers
    - _Requirements: 11.1, 11.2_

  - [ ] 13.2 Complete initAdminDashboard() in app.js
    - Fetch `GET /api/users/students` and render all students in `#students-table`
    - Fetch `GET /api/mentors` and render all mentors in `#mentors-table`
    - _Requirements: 11.1, 11.2_

- [ ] 14. CSS and design system consistency pass
  - [ ] 14.1 Audit all HTML pages and CSS files for design token usage
    - Replace any hardcoded colour hex values with CSS variables defined in variables.css
    - Ensure `--color-primary: #0B1F3A`, `--color-gold: #D4AF37`, `--color-bg: #F8F5EF`, `--color-card: #FFFFFF`, `--color-text: #333333`, `--color-accent: #4A90E2`, `--color-success: #28A745`, `--color-warning: #F39C12`, `--color-error: #E74C3C` are defined and used
    - _Requirements: NFR-2_

  - [ ] 14.2 Apply responsive layout across all pages
    - Ensure grid/flex layouts collapse correctly at 768px and 1024px breakpoints
    - Test navbar, cards, forms, tables on mobile (<768px) and tablet (768–1023px)
    - _Requirements: NFR-1_

  - [ ] 14.3 Add focus states and ARIA labels to all interactive elements
    - All buttons, links, inputs, and toggles must have visible `:focus` outline and appropriate `aria-label` or `aria-labelledby`
    - _Requirements: NFR-4_

  - [ ] 14.4 Replace any placeholder/lorem ipsum text with realistic University of Ghana content
    - All visible copy must reference realistic programme names, Ghanaian companies, and relevant industries
    - _Requirements: NFR-5_

- [ ] 15. Checkpoint — verify all pages render and init functions run without console errors
  - Open each page in a browser with the Express server running; confirm no JS errors in console and all API fetches succeed or fall back gracefully.
  - _Requirements: NFR-6, NFR-7_

- [ ] 16. Test suite setup and property-based tests
  - [ ] 16.1 Install Jest and fast-check, configure package.json
    - Run `npm install --save-dev jest fast-check`
    - Add `"test": "jest"` script to package.json
    - Create `jest.config.js` at project root: `module.exports = { testEnvironment: 'node' }`
    - Create `__tests__/` directory
    - _Requirements: (Testing Strategy)_

  - [ ] 16.2 Write property tests for matching algorithm
    - Create `__tests__/matching.test.js`
    - Import calculateScore and getMatchReasons from matching.js (or a shared module)
    - Implement fast-check properties: P6, P7, P8, P9 — tag each `// Feature: mentorbridge-platform, Property N: <text>`
    - Use `numRuns: 100` for all fc.assert calls
    - _Requirements: 3.1–3.9_

  - [ ] 16.3 Write property tests for API endpoints (mentors and matching routes)
    - Create `__tests__/api.test.js`
    - Use supertest or node-fetch against a test instance of Express server
    - Implement fast-check properties: P10, P11, P12
    - _Requirements: 3.10, 4.2, 4.3_

  - [ ] 16.4 Write property tests for UI rendering helpers
    - Create `__tests__/rendering.test.js`
    - Extract renderMentorCard(), renderRecommendationCard(), renderResourceCard(), renderMentorProfilePage() as pure functions if not already
    - Implement fast-check properties: P1, P2, P3, P13
    - _Requirements: 1.6, 3.10, 5.1, 7.1_

  - [ ] 16.5 Write property tests for notifications and theme
    - Create `__tests__/ui.test.js`
    - Implement jsdom-based tests (or pure logic tests) for P14, P15, P16, P17
    - _Requirements: 6.2, 8.1, 8.2, 10.1–10.3_

- [ ] 17. Final checkpoint — all tests pass
  - Run `npm test` and confirm all Jest test suites pass. Fix any failures before marking complete. Ask the user if questions arise.
