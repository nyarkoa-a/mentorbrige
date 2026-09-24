# MentorBridge Platform — Design Document

## Overview

MentorBridge is a full-stack, AI-powered mentorship platform for University of Ghana students. It connects students with alumni and industry professionals through a compatibility-scored matching algorithm and a curated resource library. The platform runs in full demo/mock mode — all data is served from an in-memory mock store.

---

## Architecture

```
Browser (Vanilla HTML/CSS/JS)
        │
        │  HTTP REST  (localhost:3000)
        ▼
Express Server  (backend/server.js)
        │
        ├── /api/mentors       → backend/routes/mentors.js
        ├── /api/matching      → backend/routes/matching.js
        ├── /api/resources     → backend/routes/resources.js
        ├── /api/users         → backend/routes/users.js
        └── /api/notifications → backend/routes/notifications.js
                │
                └── backend/data/mockData.js  (single source of truth)
```

### Request Flow

1. HTML page loads from `public/pages/*.html` (landing at `public/index.html`)
2. `public/js/app.js` reads `document.body.dataset.page` and calls the matching init function
3. Init functions fetch from the Express REST API
4. Routes read/write `mockData.js` in memory
5. Rendered HTML fragments are injected into placeholder containers

---

## app.js — Central Dispatcher

`public/js/app.js` is the single entry point for all client-side page logic. On `DOMContentLoaded` it reads the `data-page` attribute from `<body>` and dispatches to the correct init function:

```js
const pageInitMap = {
  'home':              initHome,
  'login':             initLogin,
  'register':          initRegister,
  'student-dashboard': initStudentDashboard,
  'mentor-directory':  initDirectory,
  'mentor-profile':    initMentorProfile,
  'student-profile':   initStudentProfile,
  'resource-centre':   initResourceCentre,
  'mentor-dashboard':  initMentorDashboard,
  'notifications':     initNotifications,
  'settings':          initSettings,
  'admin-dashboard':   initAdminDashboard,
};

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (pageInitMap[page]) pageInitMap[page]();
});
```

Each init function is self-contained — it handles fetching, rendering, and event binding for its page only.

---

## Pages

| Page | File | `data-page` value | Init Function |
|---|---|---|---|
| Landing | `public/index.html` | `home` | `initHome()` |
| Login | `public/pages/login.html` | `login` | `initLogin()` |
| Register | `public/pages/register.html` | `register` | `initRegister()` |
| Student Dashboard | `public/pages/student-dashboard.html` | `student-dashboard` | `initStudentDashboard()` |
| Mentor Directory | `public/pages/mentor-directory.html` | `mentor-directory` | `initDirectory()` |
| Mentor Profile | `public/pages/mentor-profile.html` | `mentor-profile` | `initMentorProfile()` |
| Student Profile | `public/pages/student-profile.html` | `student-profile` | `initStudentProfile()` |
| Resource Centre | `public/pages/resource-centre.html` | `resource-centre` | `initResourceCentre()` |
| Mentor Dashboard | `public/pages/mentor-dashboard.html` | `mentor-dashboard` | `initMentorDashboard()` |
| Notifications | `public/pages/notifications.html` | `notifications` | `initNotifications()` |
| Settings | `public/pages/settings.html` | `settings` | `initSettings()` |
| Admin Dashboard | `public/pages/admin-dashboard.html` | `admin-dashboard` | `initAdminDashboard()` |

---

## API Endpoints

### Mentors
- `GET /api/mentors` — params: `search`, `industry`, `skill`, `careerField`, `availability`, `minExperience`, `minRating`, `featured` → `{ mentors, total }`
- `GET /api/mentors/filters` → `{ industries, skills, careerFields }`
- `GET /api/mentors/:id` → `Mentor` or 404

### Matching
- `POST /api/matching/recommend` — body: `StudentProfile` → `{ recommendations: MatchedMentor[], algorithm }`
- `POST /api/matching/demo` — body: optional `StudentProfile` → `{ recommendations }` (top 3)

### Resources
- `GET /api/resources` → `{ resources: Resource[] }`

### Users
- `GET /api/users/students` → `{ students: Student[] }`
- `GET /api/users/requests` → `{ requests: MentorshipRequest[] }`
- `POST /api/users/requests` — body: `{ studentId, studentName, mentorId, mentorName, message }` → 201

### Notifications
- `GET /api/notifications/:userId` → `{ notifications: Notification[] }`
- `PATCH /api/notifications/:id/read` → updated `Notification`

---

## Data Models

### Mentor
```js
{
  id: string,
  name: string,
  photo: string,
  company: string,
  position: string,
  biography: string,
  education: string,
  yearsExperience: number,
  skills: string[],
  industries: string[],
  languages: string[],
  availability: string,
  rating: number,        // 0.0–5.0
  reviewCount: number,
  careerField: string,
  programme: string,
  isFeatured: boolean,
  reviews: Review[]
}
```

### Review
```js
{ student: string, rating: number, text: string, date: string }
```

### Student
```js
{
  id: string, name: string, programme: string,
  level: string, skills: string[], interests: string[],
  careerGoals: string[], careerField: string
}
```

### StudentProfile (matching input)
```js
{ programme, level, skills, interests, careerGoals, careerField }
```

### MatchedMentor
```js
{ ...Mentor, matchScore: number, matchReasons: string[] }
```

### MentorshipRequest
```js
{
  id: string, studentId: string, studentName: string,
  mentorId: string, mentorName: string,
  status: 'pending' | 'accepted' | 'rejected',
  message: string, date: string
}
```

### Resource
```js
{
  id: string, title: string, category: string,
  description: string, icon: string,
  readTime: string, type: 'template' | 'guide' | 'tool'
}
```

### Notification
```js
{
  id: string, userId: string,
  type: 'session' | 'request' | 'resource' | 'announcement',
  title: string, message: string, read: boolean, date: string
}
```

---

## AI Matching Weights

```js
weights = {
  programme:   25,  // exact match
  careerField: 20,  // exact match
  skills:      20,  // proportional overlap
  interests:   15,  // proportional overlap with industries
  careerGoals: 15,  // goal-to-mentor-skill overlap
  level:        5   // base bonus
}
// + mentor.rating * 2 quality bonus, total capped at 100
```

The algorithm is implemented identically in:
- `public/js/matching.js` — client-side (`window.MentorMatching`)
- `backend/routes/matching.js` — server-side

---

## UI Modules

| Module | File | Responsibility |
|---|---|---|
| App Dispatcher | `public/js/app.js` | Routes page init via `data-page` |
| ThemeManager | `public/js/theme.js` | Dark/light theme via `data-theme` on `<html>`, persisted to localStorage |
| MentorMatching | `public/js/matching.js` | Client-side compatibility scoring |
| FirebaseAuth | `public/js/firebase-auth.js` | Auth helpers with mock fallback |

---

## Error Handling

- **API errors**: `{ "error": "message" }` with 400 / 404 / 500
- **Fetch failures**: `.catch()` in every fetch falls back to local sample data arrays
- **Auth errors**: `error.message` displayed in feedback element
- **Form validation**: synchronous check before any async call; empty/whitespace short-circuits
- **Missing URL params**: `initMentorProfile()` shows plain-text error if `?id=` missing or 404

---

## Correctness Properties

| # | Property |
|---|---|
| P1 | `renderMentorCard(mentor)` HTML contains name, position, company, and profile link |
| P2 | Recommendation card HTML contains `matchScore` value |
| P3 | Resource card HTML contains title, category, description, readTime |
| P4 | Login/register with empty required fields: no redirect, non-empty error message |
| P5 | Successful login redirects to role-appropriate dashboard URL |
| P6 | `calculateScore(student, mentor)` returns number in [0, 100] |
| P7 | programme match → score ≥ score when no match (all else equal) |
| P8 | A.skills ⊃ B.skills → calculateScore(A, mentor) ≥ calculateScore(B, mentor) |
| P9 | `getMatchReasons` returns array of length ≤ 3 |
| P10 | `POST /api/matching/recommend` returns ≤ 6 results sorted descending by matchScore |
| P11 | `GET /api/mentors` with filters returns only mentors satisfying all predicates |
| P12 | `GET /api/mentors?search=x` returns only mentors containing x in name/company/skills/industries |
| P13 | `renderMentorProfilePage(mentor)` HTML contains name, position, company, biography, skills, reviews heading |
| P14 | Valid profile save: in-memory record updated, success message shown |
| P15 | notification.read === false → CSS class `unread`; true → class `read` |
| P16 | After "mark all read": every notification has read === true |
| P17 | ThemeManager: dataset.theme and localStorage both equal applied value; toggle twice returns to original |

---

## Testing Strategy

- **Runner**: Jest (`npm install --save-dev jest`)
- **PBT**: fast-check (`npm install --save-dev fast-check`)
- **Location**: `__tests__/` at project root
- **Min iterations**: 100 per property test (`numRuns: 100`)
- **Tag format**: `// Feature: mentorbridge-platform, Property N: <text>`
