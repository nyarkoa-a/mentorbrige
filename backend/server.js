/**
 * MentorBridge Backend Server
 * Express.js API for mentorship platform
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const mentorsRouter = require('./routes/mentors');
const matchingRouter = require('./routes/matching');
const resourcesRouter = require('./routes/resources');
const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');
const analyticsRouter = require('./routes/analytics');
const configRouter = require('./routes/config');
const sessionsRouter = require('./routes/sessions');
const testimonialsRouter = require('./routes/testimonials');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1d',
  etag: true
}));

// ── Admin route protection (simplified) ─────────────────────────────────────
// Admin files are accessible, but API protection can be added later if needed
const ADMIN_KEY = process.env.ADMIN_KEY || 'mb-admin-2026';

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Admin access denied. Invalid key.' });
  }
  next();
}

// Apply admin protection to admin API routes (when we add them)
app.use('/api/admin', requireAdmin);
// ── End admin protection ─────────────────────────────────────────────────────

app.use('/api/mentors', mentorsRouter);
app.use('/api/matching', matchingRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/users', usersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/config', configRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/testimonials', testimonialsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', platform: 'MentorBridge', version: '1.0.0' });
});

// ── Friendly dashboard & admin routes ─────────────────────────────────────────
const publicDir = path.join(__dirname, '../public');

const pageRoutes = {
  '/mentee/dashboard': 'pages/student-dashboard.html',
  '/mentor/dashboard': 'pages/mentor-dashboard.html',
  '/admin/login': 'pages/admin-login.html',
  '/admin/dashboard': 'admin/dashboard.html',
  '/admin/mentees': 'admin/mentees.html',
  '/admin/mentors': 'admin/mentors.html',
  '/admin/applications': 'admin/applications.html',
  '/admin/sessions': 'admin/sessions.html',
  '/admin/payments': 'admin/payments.html',
  '/admin/reports': 'admin/reports.html',
  '/admin/settings': 'admin/settings.html',
  '/admin/help': 'admin/help.html',
  '/admin/mentor-detail': 'admin/mentor-detail.html',
  '/admin/setup': 'admin/setup.html',
  // Mentor routes
  '/mentor-directory': 'pages/mentor-directory.html',
  '/mentor-profile': 'pages/mentor-profile.html',
  '/sessions': 'pages/sessions.html',
  '/resource-centre': 'pages/resource-centre.html',
  '/messages': 'pages/messages.html',
  '/settings': 'pages/settings.html',
  '/notifications': 'pages/notifications.html',
  // Mentee routes
  '/student-profile': 'pages/student-profile.html',
  '/goals': 'pages/goals.html',
  '/opportunities': 'pages/opportunities.html',
  // Common routes
  '/blog': 'pages/blog.html',
  '/careers': 'pages/careers.html',
  '/privacy': 'pages/privacy.html',
  '/terms': 'pages/terms.html'
};

Object.entries(pageRoutes).forEach(([route, file]) => {
  app.get(route, (_req, res) => {
    res.sendFile(path.join(publicDir, file));
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const filePath = path.join(__dirname, '../public', req.path);
  if (req.path.includes('.') && require('fs').existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`MentorBridge server running at http://localhost:${PORT}`);
});

module.exports = app;
