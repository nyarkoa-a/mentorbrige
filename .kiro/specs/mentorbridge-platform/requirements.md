# MentorBridge Platform — Requirements

## Overview

MentorBridge is an AI-powered mentorship platform for University of Ghana students. It connects students with alumni and industry professionals through a compatibility-scored matching algorithm, a mentor directory, and a curated resource library. The platform runs in full demo/mock mode — all data is served from an in-memory mock store.

---

## Functional Requirements

### 1. Landing Page

- **1.1** Sticky navbar with logo, nav links, and Login/Register CTAs.
- **1.2** Hero section with headline, subheading, and two CTA buttons: "Find a Mentor" and "Become a Mentor".
- **1.3** Stats section with platform statistics (mentors, students matched, sessions completed).
- **1.4** "How It Works" section with 3–4 steps.
- **1.5** "Why Choose MentorBridge" section highlighting key benefits.
- **1.6** Featured Mentors section displaying up to 6 mentor cards from mock data.
- **1.7** AI Matching Demo section showing top 3 matched mentors for a sample student with scores.
- **1.8** Career Resources preview showing 3 resource cards linking to the Resource Centre.
- **1.9** Testimonials carousel with 3–5 student testimonials and navigation controls.
- **1.10** FAQ accordion with 5–7 questions and expandable answers.
- **1.11** Contact section with a name/email/message form.
- **1.12** Newsletter signup band with email input and subscribe button.
- **1.13** Footer with links, social icons, and copyright.

### 2. Authentication

- **2.1** Login page supports email/password login for students and mentors.
- **2.2** Login page includes Remember Me checkbox, Forgot Password link, and show/hide password toggle.
- **2.3** Successful login redirects students to student-dashboard and mentors to mentor-dashboard.
- **2.4** Register page has a role toggle (Student / Mentor).
- **2.5** Student fields: full name, email, password, programme, academic level, skills, interests, career goal.
- **2.6** Mentor fields: full name, email, password, expertise, industry, bio.
- **2.7** All required fields validated client-side before submission.
- **2.8** Platform works fully in mock/demo mode without live Firebase.

### 3. AI Matching

- **3.1** `calculateScore(student, mentor)` returns a number in [0, 100].
- **3.2** Programme match contributes 25 points.
- **3.3** Career field match contributes 20 points.
- **3.4** Skill overlap contributes up to 20 points (proportional).
- **3.5** Interest/industry overlap contributes up to 15 points.
- **3.6** Career goal overlap contributes up to 15 points.
- **3.7** Academic level contributes 5 base points.
- **3.8** Mentor rating contributes a quality bonus (rating × 2, capped so total ≤ 100).
- **3.9** `getMatchReasons(student, mentor)` returns at most 3 human-readable reason strings.
- **3.10** `POST /api/matching/recommend` returns up to 6 mentors sorted descending by matchScore.
- **3.11** Matching module implemented identically client-side (matching.js) and server-side.

### 4. Mentor Directory

- **4.1** Searchable, filterable grid of mentor cards.
- **4.2** Search bar filters by name, company, skills, or industry (case-insensitive).
- **4.3** Filters: industry, skills, career field, availability, min experience, min rating (AND logic).
- **4.4** Each card shows photo, name, position, company, top 3 skills, rating, "View Profile" button.
- **4.5** `GET /api/mentors/filters` returns available filter values from mock data.

### 5. Mentor Profile

- **5.1** Displays: photo, name, position, company, biography, education, years of experience, skills, industries, languages, availability, rating, review count.
- **5.2** Reviews section with student name, rating, text, and date.
- **5.3** "Request Mentorship" button creates a request via `POST /api/users/requests`.
- **5.4** Missing/invalid `?id=` param shows a clear error message.

### 6. Student Profile

- **6.1** Edit page for: profile picture, programme, academic level, skills, interests, career goals, resume upload, LinkedIn URL.
- **6.2** On save, in-memory record updates and success message displays.

### 7. Resource Centre

- **7.1** Displays 4–6 resources: resume template, interview prep guide, career roadmap, networking guide.
- **7.2** Each card shows title, category, description, read time, and a download/view button.

### 8. Notifications

- **8.1** Unread notifications have CSS class `unread`; read ones have class `read`.
- **8.2** "Mark All as Read" sets every notification's read flag to true and updates the UI.
- **8.3** Bell icon in navbar shows unread count badge.

### 9. Mentor Dashboard (Lightweight)

- **9.1** List of pending mentorship requests with Accept and Decline actions.
- **9.2** Profile edit section.
- **9.3** No messaging, calendar, or analytics.

### 10. Settings

- **10.1** Dark/light mode toggle.
- **10.2** Theme persisted to localStorage under key `theme`.
- **10.3** Stored theme applied on page load (no flash).
- **10.4** Password change form (current, new, confirm).

### 11. Admin Dashboard (Lightweight)

- **11.1** Table of all students from mock data.
- **11.2** Table of all mentors from mock data.
- **11.3** No analytics or charts.

---

## Non-Functional Requirements

- **NFR-1** Fully responsive: desktop (≥1024px), tablet (768–1023px), mobile (<768px).
- **NFR-2** Design system colours applied exactly: #0B1F3A, #D4AF37, #F8F5EF, #FFFFFF, #333333, #4A90E2.
- **NFR-3** Typography: Poppins or Inter only.
- **NFR-4** All interactive elements have visible focus states and ARIA labels.
- **NFR-5** No lorem ipsum — all content realistic for University of Ghana students.
- **NFR-6** Client-side fetch failures degrade gracefully with local fallback data.
- **NFR-7** Full functionality in mock/demo mode with no live database or Firebase connection.
