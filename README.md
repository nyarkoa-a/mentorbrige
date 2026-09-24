# MentorBridge

**AI-Powered Student Mentorship Platform** for University of Ghana students.

MentorBridge connects students with experienced mentors based on academic programme, skills, career interests, goals, industry, and level of study. The platform delivers a polished, launch-ready experience with role-based dashboards, AI mentor matching, a resource centre, and Firebase-ready architecture.

## Features

- **Landing page** — Hero, statistics, trusted-by section, how it works, featured mentors, AI matching demo, resources, testimonials, FAQ, contact, newsletter
- **Authentication** — Student, mentor, and admin login/register with Firebase (demo mode when not configured)
- **Student dashboard** — Recommended mentors, sessions, notifications, checklist, profile completion, quick actions
- **Mentor dashboard** — Requests, availability, session history, student profiles
- **Admin dashboard** — Analytics, user management, reports
- **Mentor directory** — Search and filter by industry, skills, career field, experience, rating
- **Mentor & student profiles** — Full professional profiles with reviews and editable student details
- **AI matching** — Modular compatibility scoring (replaceable with real AI)
- **Resource centre** — Resume templates, interview prep, career roadmaps, networking guides
- **Global search** — Search mentors, resources, and industries (⌘K / Ctrl+K)
- **Settings** — Dark/light mode, notification preferences, password change
- **Responsive & accessible** — Mobile, tablet, desktop with semantic HTML and ARIA

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | Firebase Firestore (configured) |
| Auth | Firebase Authentication |
| Hosting | Firebase Hosting / Netlify ready |

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo mode:** Login works without Firebase — use any email/password on the login page to access dashboards.

## Firebase setup

1. Copy `.env.example` to `.env`
2. Add your Firebase project credentials
3. Restart the server

```bash
cp .env.example .env
npm run dev
```

## Project structure

```
mentorbridge/
├── backend/
│   ├── server.js           # Express server
│   ├── data/mockData.js    # Realistic UG mentor & resource data
│   ├── database/           # SQLite schema and migrations
│   └── routes/             # API: mentors, matching, resources, users, analytics
├── public/
│   ├── index.html          # Landing page
│   ├── pages/              # Login, register, dashboards, directory, profiles
│   ├── css/                # variables, base, components, main
│   ├── js/                 # app, firebase, theme, search, matching
│   └── assets/             # Logo and icons
├── scripts/                # Helper & administrative utilities
├── tests/                  # Test suites, runners, diagnostics, and reports
│   ├── runners/            # Automated test execution runners
│   ├── suites/             # Core property & integration test files
│   ├── diagnostics/        # Interactive HTML test & debug pages
│   └── reports/            # Test checkpoint and baseline JSON reports
├── firebase/
│   ├── firebase.json       # Hosting config
│   └── firestore.rules     # Security rules
└── package.json
```

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/mentors` | List/filter mentors |
| GET | `/api/mentors/:id` | Mentor profile |
| POST | `/api/matching/demo` | AI matching demo |
| GET | `/api/resources` | Career resources |
| GET | `/api/analytics/dashboard` | Admin analytics |

## Design

- **Colours:** Navy (#0B1F3A), Gold (#D4AF37), Cream (#F8F5EF)
- **Typography:** Inter
- **Style:** Premium, clean, professional mentorship platform

## Future enhancements

- Connect Firebase Auth and Firestore for production user accounts
- Replace mock matching with a real AI/ML service
- Deploy to Firebase Hosting or Netlify
